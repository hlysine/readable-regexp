import QuantityModifier from './QuantityModifier';

export default class SimpleQuantifier extends QuantityModifier {
  private readonly quantifier: (regExp: string) => string;

  public constructor(quantifier: (regExp: string) => string, lazy = false) {
    super(lazy);
    this.quantifier = quantifier;
  }

  protected quantify(regExp: string): string {
    return this.quantifier(regExp);
  }

  public clone(): SimpleQuantifier {
    return new SimpleQuantifier(this.quantifier, this.lazy);
  }
}
