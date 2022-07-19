export type LiteralArgument = [string | number] | [TemplateStringsArray, ...unknown[]];

export function isTemplateStringsArray(arg: unknown): arg is TemplateStringsArray {
  return Array.isArray(arg) && Object.hasOwn(arg, 'raw');
}

export function isLiteralArgument(args: unknown[]): args is LiteralArgument {
  if (args.length === 0) {
    return false;
  } else if (args.length === 1) {
    return typeof args[0] === 'string' || typeof args[0] === 'number';
  } else {
    return isTemplateStringsArray(args[0]);
  }
}

export function getLiteralString(args: LiteralArgument): string {
  if (args.length === 1) {
    return String(args[0]);
  } else {
    return (args[0] as TemplateStringsArray).map((text, i) => (i > 0 ? args[i] : '') + text).join('');
  }
}
