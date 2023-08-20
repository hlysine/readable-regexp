import { RegExpModifier } from '../types';
import { wrapIfNeeded } from '../helper';

const NOT_QUANTIFIABLE = new Set(['^', '$', '\\b', '\\B']);

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
