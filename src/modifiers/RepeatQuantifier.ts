import QuantityModifier from './QuantityModifier';

export default class RepeatQuantifier extends QuantityModifier {
  private readonly min?: number;
  private readonly max?: number;

  public constructor(min?: number, max?: number, lazy = false) {
    super(lazy);
    this.min = min;
    this.max = max;
    if (min !== undefined && typeof min !== 'number') {
      throw new Error('min is invalid');
    }
    if (max !== undefined && typeof max !== 'number') {
      throw new Error('max is invalid');
    }
    if (this.min !== undefined && this.max !== undefined && this.min > this.max) {
      throw new Error('Quantifier range is out of order');
    } else if (this.min === undefined && this.max === undefined) {
      throw new Error('No min or max provided for RepeatQuantifier');
    }
  }

  protected quantify(regExp: string): string {
    if (this.min !== undefined && this.max !== undefined) {
      if (this.min === this.max) {
        return `${regExp}{${this.min}}`;
      } else {
        return `${regExp}{${this.min},${this.max}}`;
      }
    } else if (this.min !== undefined) {
      return `${regExp}{${this.min},}`;
    } else if (this.max !== undefined) {
      return `${regExp}{,${this.max}}`;
    } else {
      throw new Error('No min or max provided for RepeatQuantifier');
    }
  }

  public clone(): RepeatQuantifier {
    return new RepeatQuantifier(this.min, this.max, this.lazy);
  }
}
