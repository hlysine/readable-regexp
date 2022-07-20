import QuantityModifier from './QuantityModifier';

export default class RepeatQuantifier extends QuantityModifier {
  private readonly min: number | null;
  private readonly max: number | null;

  public constructor(min: number | null, max: number | null) {
    super();
    this.min = min;
    this.max = max;
  }

  protected quantify(regex: string): string {
    if (this.min !== null && this.max !== null) {
      if (this.min === this.max) {
        return `${regex}{${this.min}}`;
      } else {
        return `${regex}{${this.min},${this.max}}`;
      }
    } else if (this.min !== null) {
      return `${regex}{${this.min},}`;
    } else if (this.max !== null) {
      return `${regex}{,${this.max}}`;
    } else {
      throw new Error('No min or max provided for RepeatQuantifier');
    }
  }

  public clone(): RepeatQuantifier {
    return new RepeatQuantifier(this.min, this.max);
  }
}
