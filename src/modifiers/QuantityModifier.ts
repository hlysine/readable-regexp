import { isBracketGroup, isCharacterGroup, unicodeLiteral } from '../helper';
import { RegexModifier } from '../types';

const NOT_QUANTIFIABLE = new Set(['^', '$', '\\b', '\\B']);

function wrapIfNeeded(regex: string): string {
  if (regex.length === 1) return regex;
  if (regex.length === 2 && regex.startsWith('\\')) return regex;
  if (unicodeLiteral.test(regex)) return regex;
  if (isCharacterGroup(regex)) return regex;
  if (isBracketGroup(regex)) {
    // need to wrap lookarounds because they are not directly quantifiable
    if (!/^\((?:\?=|\?!|\?<=|\?<!)/.test(regex)) return regex;
  }
  return `(?:${regex})`;
}

export default abstract class QuantityModifier implements RegexModifier {
  public lazy: boolean;

  protected constructor(lazy: boolean) {
    this.lazy = lazy;
  }

  public modify(regex: string): [string, string?] {
    if (NOT_QUANTIFIABLE.has(regex)) {
      throw new Error('The provided token is not quantifiable');
    }
    // todo: only wrap in group if necessary
    return [this.quantify(wrapIfNeeded(regex)) + (this.lazy ? '?' : '')];
  }

  protected abstract quantify(regex: string): string;

  public abstract clone(): QuantityModifier;
}
