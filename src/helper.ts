import { RegexLiteral } from './types';

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
export function isLiteralArgument(args: unknown[]): args is RegexLiteral {
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
 * @returns The literal string.
 */
export function getLiteralString(args: RegexLiteral): string {
  if (args.length === 1) {
    return String(args[0]);
  } else {
    return (args[0] as TemplateStringsArray).map((text, i) => (i > 0 ? args[i] : '') + text).join('');
  }
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

/**
 * Get all property names of an object, including those in the prototype chain of the object.
 * @param target The object to get the property names of.
 * @returns An array of property names.
 */
export function getAllPropertyNames<T>(target: T): (keyof T)[] {
  const props: string[] = [];
  do {
    Object.getOwnPropertyNames(target).forEach(prop => {
      if (!props.includes(prop)) {
        props.push(prop);
      }
    });
  } while ((target = Object.getPrototypeOf(target)));

  return props as (keyof T)[];
}

export function isCharacterGroup(regex: string): boolean {
  if (!regex.startsWith('[')) {
    return false;
  }

  let charEscaped = false;
  for (let i = 1; i < regex.length; i++) {
    const char = regex[i];
    if (charEscaped) {
      charEscaped = false;
    } else if (char === '\\') {
      charEscaped = true;
    } else if (char === ']') {
      return i === regex.length - 1;
    }
  }

  return false;
}

export function isBracketGroup(regex: string): boolean {
  if (!regex.startsWith('(')) {
    return false;
  }

  let layer = 1;
  let inCharGroup = false;
  let charEscaped = false;
  for (let i = 1; i < regex.length; i++) {
    const char = regex[i];
    if (charEscaped) {
      charEscaped = false;
    } else if (char === '\\') {
      charEscaped = true;
    } else if (char === '(' && !inCharGroup) {
      layer++;
    } else if (char === ')' && !inCharGroup) {
      layer--;
    } else if (char === '[' && !inCharGroup) {
      inCharGroup = true;
    } else if (char === ']' && inCharGroup) {
      inCharGroup = false;
    }

    if (layer === 0) {
      return i === regex.length - 1;
    }
  }

  return false;
}

export const unicodeHex = /^[0-9a-fA-F]{4}$/;

export const unicodeLiteral = /^\\u[0-9a-fA-F]{4}$/;

export const captureName = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const negatableTokens = /^\\[sdwb]$/;
