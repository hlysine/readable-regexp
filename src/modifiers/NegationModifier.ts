import { isBracketGroup, isCharacterGroup, negatableTokens, unicodeLiteral } from '../helper';
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
        if (unicodeLiteral.test(regex)) {
          return `[^${regex}]`;
        } else if (negatableTokens.test(regex)) {
          return regex.toUpperCase();
        } else if (isCharacterGroup(regex) && !regex.startsWith('[^')) {
          return `[^${regex.substring(1, regex.length - 1)}]`;
        } else if (isBracketGroup(regex) && (regex.startsWith('(?=') || regex.startsWith('(?<='))) {
          if (regex.startsWith('(?=')) {
            return `(?!${regex.substring(3, regex.length - 1)})`;
          } else {
            return `(?<!${regex.substring(4, regex.length - 1)})`;
          }
        } else {
          throw new Error('The provided token is not negatable: ' + regex);
        }
    }
  }

  public clone(): NegationModifier {
    return new NegationModifier();
  }
}
