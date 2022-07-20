import QuantityModifier from './QuantityModifier';

export default class OneOrMoreQuantifier extends QuantityModifier {
  protected quantify(regex: string): string {
    return `${regex}+`;
  }

  public clone(): OneOrMoreQuantifier {
    return new OneOrMoreQuantifier();
  }
}
