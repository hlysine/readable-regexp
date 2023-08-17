import { RegExpModifier } from '../types';
import { charLiteral, isBracketGroup, isCharacterClass } from '../helper';

const NOT_QUANTIFIABLE = new Set(['^', '$', '\\b', '\\B']);

function wrapIfNeeded(regExp: string): string {
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

export default abstract class QuantityModifier implements RegExpModifier {
  public lazy: boolean;

  protected constructor(lazy: boolean) {
    this.lazy = lazy;
  }

  public modify(regExp: string): [string, string?] {
    if (NOT_QUANTIFIABLE.has(regExp)) {
      throw new Error('The provided token is not quantifiable: ' + regExp);
    }
    if (regExp.length === 0) {
      throw new Error('There is nothing to quantify');
    }
    return [this.quantify(wrapIfNeeded(regExp)) + (this.lazy ? '?' : '')];
  }

  protected abstract quantify(regExp: string): string;

  public abstract clone(): QuantityModifier;
}
