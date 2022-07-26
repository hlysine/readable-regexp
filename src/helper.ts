import { RegExpLiteral } from './types';

/**
 * Check whether a given value is a template strings array.
 * @param arg The argument to check.
 * @returns Whether the argument is a template strings array.
 */
export function isTemplateStringsArray(arg: unknown): arg is TemplateStringsArray {
  return Array.isArray(arg) && 'raw' in arg;
}

/**
 * Check whether the argument contains exactly one string in string or template form.
 * @param args The argument to check.
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
 * @param args Arguments passed to the function, either a string or a template string.
 * @param escape Whether to escape the string.
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

/**
 * This is equivalent to the built-in Function.bind, but forwards all symbols from thisArg to the bound function.
 * This allows the quantifiable and negatable tags to be passed to the bound function.
 */
export function bind<T extends Function, U>(
  func: T,
  thisArg: U
): T & { [K in keyof U as K extends symbol ? K : never]: U[K] } {
  return func.bind(thisArg);
}

/**
 * Copy all properties from source to target, including those in the prototype chain of source.
 * @param target The target object to which the properties will be added.
 * @param source The source object from which the properties will be copied.
 * @returns The target object.
 */
export function assign<T extends Function, U>(target: T, source: U): T & U {
  target = target.bind(source);

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

export function escapeRegExp(text: string): string {
  return text.replace(/[-[/\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export const hexNumber = /^[0-9a-fA-F]+$/;

export const octalNumber = /^[0-7]+$/;

export const charLiteral = /^(?:\\u[0-9a-fA-F]{4}$|\\x[0-9a-fA-F]{2}|\\\d{1,3})/; // last option refers to octal character or capture group backreference

export const captureName = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const negatableTokens = /^\\[sdwb]$/;

export const flagString = /^[gmiyusd]*$/;
