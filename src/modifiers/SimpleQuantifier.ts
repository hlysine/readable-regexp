import QuantityModifier from './QuantityModifier';

export default class SimpleQuantifier extends QuantityModifier {
  private readonly quantifier: (regex: string) => string;

  public constructor(quantifier: (regex: string) => string, lazy = false) {
    super(lazy);
    this.quantifier = quantifier;
  }

  protected quantify(regex: string): string {
    return this.quantifier(regex);
  }

  public clone(): SimpleQuantifier {
    return new SimpleQuantifier(this.quantifier, this.lazy);
  }
}
