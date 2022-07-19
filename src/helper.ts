export type RegexLiteral = [string | number] | [TemplateStringsArray, ...unknown[]];

export function isTemplateStringsArray(arg: unknown): arg is TemplateStringsArray {
  return Array.isArray(arg) && Object.hasOwn(arg, 'raw');
}

export function isLiteralArgument(args: unknown[]): args is RegexLiteral {
  if (args.length === 0) {
    return false;
  } else if (args.length === 1) {
    return typeof args[0] === 'string' || typeof args[0] === 'number' || isTemplateStringsArray(args[0]);
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
export function assign<T, U>(target: T, source: U): T & U {
  do {
    Object.getOwnPropertyNames(source).forEach((prop) => {
      Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop)!);
    });
  } while ((source = Object.getPrototypeOf(source)) && source !== Object.prototype);

  return target as T & U;
}
