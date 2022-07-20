import { RegexLiteral } from './types';

export function isTemplateStringsArray(arg: unknown): arg is TemplateStringsArray {
  return Array.isArray(arg) && 'raw' in arg;
}

export function isLiteralArgument(args: unknown[]): args is RegexLiteral {
  if (args.length === 0) {
    return false;
  } else if (args.length === 1) {
    return typeof args[0] === 'string' || isTemplateStringsArray(args[0]);
  } else {
    return isTemplateStringsArray(args[0]);
  }
}

export function getLiteralString(args: RegexLiteral): string {
  if (args.length === 1) {
    return String(args[0]);
  } else {
    return (args[0] as TemplateStringsArray).map((text, i) => (i > 0 ? args[i] : '') + text).join('');
  }
}

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

export function getAllPropertyNames(target: unknown): string[] {
  const props: string[] = [];
  do {
    Object.getOwnPropertyNames(target).forEach(prop => {
      if (!props.includes(prop)) {
        props.push(prop);
      }
    });
  } while ((target = Object.getPrototypeOf(target)));

  return props;
}
