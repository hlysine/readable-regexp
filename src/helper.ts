import { IncompleteToken, RegExpLiteral } from './types';

export function escapeRegExp(text: string): string {
  return text.replace(/[-[/\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export const hexNumber = /^[0-9a-fA-F]+$/;

export const octalNumber = /^[0-7]+$/;

export const controlChar = /^[a-zA-Z]$/;

// octal escape sequences are not matched here because they should be wrapped in a character class
export const negatableCharLiteral = /^(?:\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}|\\c[a-zA-Z])$/;

// last option refers to octal character or capture group backreference
export const charLiteral = /^(?:\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}|\\c[a-zA-Z]|\\\d{1,3})$/;

export const captureName = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const negatableTokens = /^\\[sdwb]$/;

export const flagString = /^[dgimsuvy]*$/;

/**
 * Check whether a given value is a template strings array.
 * @param arg - The argument to check.
 * @returns Whether the argument is a template strings array.
 */
export function isTemplateStringsArray(arg: unknown): arg is TemplateStringsArray {
  return Array.isArray(arg) && 'raw' in arg;
}

/**
 * Check whether the argument contains exactly one string in string or template form.
 * @param args - The argument to check.
 * @returns Whether the argument contains exactly one string in string or template form.
 */
export function isLiteralArgument(args: unknown[]): args is RegExpLiteral {
  if (args.length === 0) {
    return false;
  } else if (args.length === 1) {
    return typeof args[0] === 'string' || isTemplateStringsArray(args[0]);
  } else {
    return isTemplateStringsArray(args[0]);
  }
}

/**
 * Get the literal string from a string or template string array.
 * @param args - Arguments passed to the function, either a string or a template string.
 * @param escape - Whether to escape the string.
 * @returns The literal string.
 */
export function getLiteralString(args: RegExpLiteral, escape = true): string {
  let ret: string;
  if (args.length === 1) {
    ret = String(args[0]); // also handles the case when the argument is a template string with one string
  } else {
    ret = (args[0] as TemplateStringsArray).map((text, i) => (i > 0 ? args[i] : '') + text).join('');
  }
  return escape ? escapeRegExp(ret) : ret;
}

const incompleteTokenError = (tokenName: string, funcName: string, internal: boolean) => {
  throw new Error(
    `Required parameters are missing in the token ${tokenName}. ${
      internal
        ? `(Error thrown from internal function ${funcName}.)`
        : `You should call ${tokenName} as a function to provide the required parameters before using ${funcName}.`
    }`
  );
};

const incompleteToken = (tokenName: string): IncompleteToken => ({
  toString: (() => incompleteTokenError(tokenName, 'toString', false)) as never,
  toRegExp: (() => incompleteTokenError(tokenName, 'toRegExp', false)) as never,
  executeModifiers: (() => incompleteTokenError(tokenName, 'executeModifiers', true)) as never,
  addModifier: (() => incompleteTokenError(tokenName, 'addModifier', true)) as never,
  addNode: (() => incompleteTokenError(tokenName, 'addNode', true)) as never,
});

/**
 * A special bind function for incomplete tokens with required parameters such that errors are thrown when the token
 * is used without the required parameters.
 */
export function bindAsIncomplete<T extends Function, U>(
  func: T,
  thisArg: U,
  tokenName: string
): T & { [K in keyof U as K extends symbol ? K : never]: U[K] } & IncompleteToken {
  return assign(func.bind(thisArg), incompleteToken(tokenName));
}

/**
 * Copy all properties from source to target, including those in the prototype chain of source.
 * @param target - The target object to which the properties will be added.
 * @param source - The source object from which the properties will be copied.
 * @param bindFunc - Whether to bind target to source.
 * @returns The target object.
 */
export function assign<T extends Function, U>(target: T, source: U, bindFunc = true): T & U {
  if (bindFunc) target = target.bind(source);

  const props: string[] = [];
  do {
    Object.getOwnPropertyNames(source).forEach(prop => {
      if (!props.includes(prop)) {
        Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop)!);
        props.push(prop);
      }
    });
  } while ((source = Object.getPrototypeOf(source)) && source !== Object.prototype);

  return target as T & U;
}

export function isCharacterClass(regExp: string): boolean {
  if (!regExp.startsWith('[')) {
    return false;
  }

  let charEscaped = false;
  for (let i = 1; i < regExp.length; i++) {
    const char = regExp[i];
    if (charEscaped) {
      charEscaped = false;
    } else if (char === '\\') {
      charEscaped = true;
    } else if (char === ']') {
      return i === regExp.length - 1;
    }
  }

  return false;
}

export function isBracketGroup(regExp: string): boolean {
  if (!regExp.startsWith('(')) {
    return false;
  }

  let layer = 1;
  let inCharClass = false;
  let charEscaped = false;
  for (let i = 1; i < regExp.length; i++) {
    const char = regExp[i];
    if (charEscaped) {
      charEscaped = false;
    } else if (char === '\\') {
      charEscaped = true;
    } else if (char === '(' && !inCharClass) {
      layer++;
    } else if (char === ')' && !inCharClass) {
      layer--;
    } else if (char === '[' && !inCharClass) {
      inCharClass = true;
    } else if (char === ']' && inCharClass) {
      inCharClass = false;
    }

    if (layer === 0) {
      return i === regExp.length - 1;
    }
  }

  return false;
}

export function wrapIfNeeded(regExp: string): string {
  if (regExp.length === 1) return regExp;
  if (regExp.length === 2 && regExp.startsWith('\\')) return regExp;
  if (charLiteral.test(regExp)) return regExp;
  if (isCharacterClass(regExp)) return regExp;
  if (isBracketGroup(regExp)) {
    // need to wrap lookarounds because they are not directly quantifiable
    if (!/^\((?:\?=|\?!|\?<=|\?<!)/.test(regExp)) return regExp;
  }
  return `(?:${regExp})`;
}

export function escapeForCharClass(option: string): string {
  if (option.startsWith('-')) {
    option = '\\-' + option.substring(1);
  }
  let charEscaped = false;
  for (let i = 0; i < option.length; i++) {
    const char = option[i];
    if (charEscaped) {
      charEscaped = false;
    } else if (char === '\\' || char === '-') {
      if (i === option.length - 1) {
        // escape characters at the end of the string
        option = option.slice(0, -1) + '\\' + char;
        break;
      } else if (char === '\\') {
        charEscaped = true;
      }
    } else if (char === ']' || char === '^') {
      // escape this character
      option = option.substring(0, i) + '\\' + option.substring(i);
      charEscaped = true;
    }
  }
  return option;
}

export function countTail(str: string, char: string): number {
  let count = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    if (str[i] === char) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

const specialEscapes: { [sequence: string]: string } = {
  '\\f': '\f',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '\t',
  '\\v': '\v',
};

const octalEscape = /^\\([0-7]+)$/;
const hexEscape = /^\\x([0-9a-fA-F]+)$/;
const unicodeEscape = /^\\u([0-9a-fA-F]+)$/;
const unicodeVarEscape = /^\\u\{([0-9a-fA-F]+)\}$/;
const controlEscape = /^\\c([a-zA-Z])$/;

export function getCodePoint(char: string): number {
  if ([...char].length === 1) return char.codePointAt(0)!;
  if (specialEscapes[char]) return specialEscapes[char].codePointAt(0)!;
  let match = octalEscape.exec(char);
  if (match) {
    const val = parseInt(match[1], 8);
    if (val > 0o377)
      throw new Error(`The octal escape sequence ${char} is not valid because it is greater than 0o377.`);
    return val;
  }
  match = hexEscape.exec(char);
  if (match) {
    if (match[1].length > 2)
      throw new Error(`The hex escape sequence ${char} is not valid because it is greater than 0xFF.`);
    return parseInt(match[1], 16);
  }
  match = unicodeEscape.exec(char);
  if (match) {
    if (match[1].length > 4)
      throw new Error(`The unicode escape sequence ${char} is not valid because it is greater than 0xFFFF.`);
    return parseInt(match[1], 16);
  }
  match = unicodeVarEscape.exec(char);
  if (match) {
    const val = parseInt(match[1], 16);
    if (val > 0x10ffff)
      throw new Error(`The unicode escape sequence ${char} is not valid because it is greater than 0x10FFFF.`);
    return val;
  }
  match = controlEscape.exec(char);
  if (match) return match[1].toUpperCase().codePointAt(0)! - 'A'.codePointAt(0)! + 1;
  if (char[0] === '\\' && [...char].length === 2) {
    return char[1].codePointAt(0)!;
  }
  throw new Error(`The string ${char} is not a single character.`);
}

export function compareCodePoint(char1: string, char2: string): number {
  return getCodePoint(char1) - getCodePoint(char2);
}
