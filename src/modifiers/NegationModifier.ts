import { RegExpModifier } from '../types';
import { isBracketGroup, isCharacterClass, negatableCharLiteral, negatableTokens } from '../helper';

export default class NegationModifier implements RegExpModifier {
  public modify(regExp: string): [string, string?] {
    switch (regExp) {
      case '\\v':
      case '\\n':
      case '\\f':
      case '\\r':
      case '\\t':
      case '\\0':
        return [`[^${regExp}]`];
      case '^':
      case '$':
        return [`(?!${regExp})`];
      default:
        if (negatableCharLiteral.test(regExp)) {
          return [`[^${regExp}]`];
        } else if (negatableTokens.test(regExp)) {
          return [regExp.toUpperCase()];
        } else if (isCharacterClass(regExp) && !regExp.startsWith('[^')) {
          return [`[^${regExp.substring(1, regExp.length - 1)}]`];
        } else if (isBracketGroup(regExp) && (regExp.startsWith('(?=') || regExp.startsWith('(?<='))) {
          if (regExp.startsWith('(?=')) {
            return [`(?!${regExp.substring(3, regExp.length - 1)})`];
          } else {
            return [`(?<!${regExp.substring(4, regExp.length - 1)})`];
          }
        } else {
          throw new Error('The provided token is not negatable or is already negated: ' + regExp);
        }
    }
  }

  public clone(): NegationModifier {
    return new NegationModifier();
  }
}
