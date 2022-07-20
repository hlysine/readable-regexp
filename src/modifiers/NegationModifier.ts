import { RegexModifier } from '../types';

export default class NegationModifier implements RegexModifier {
  public modify(regex: string): string {
    switch (regex) {
      case '\\v':
      case '\\n':
      case '\\r':
      case '\\t':
      case '\\0':
        return `[^${regex}]`;
      case '^':
      case '$':
        return `(?!${regex})`;
      default:
        if (regex.startsWith('\\p')) {
          return '\\P' + regex.slice(2);
        } else if (regex.length === 2 && regex.startsWith('\\')) {
          return regex.toUpperCase();
        } else {
          throw new Error('The provided token is not negatable');
        }
    }
  }

  public clone(): NegationModifier {
    return new NegationModifier();
  }
}
