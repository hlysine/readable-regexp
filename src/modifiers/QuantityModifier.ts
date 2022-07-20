import { RegexModifier } from '../types';
import { unicodeLiteral } from '../helper';

const NOT_QUANTIFIABLE = new Set(['^', '$', '\\b', '\\B']);

function wrapIfNeeded(regex: string): string {
  if (regex.length === 1) return regex;
  if (regex.length === 2 && regex.startsWith('\\')) return regex;
  if (unicodeLiteral.test(regex)) return regex;
  return `(?:${regex})`;
}

export default abstract class QuantityModifier implements RegexModifier {
  public modify(regex: string): string {
    if (NOT_QUANTIFIABLE.has(regex)) {
      throw new Error('The provided token is not quantifiable');
    }
    // todo: only wrap in group if necessary
    return this.quantify(wrapIfNeeded(regex));
  }

  protected abstract quantify(regex: string): string;

  public abstract clone(): QuantityModifier;
}
