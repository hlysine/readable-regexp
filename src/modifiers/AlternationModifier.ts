import { RegExpModifier } from '../types';

export default class AlternationModifier implements RegExpModifier {
  private readonly options: string[] = [];

  public add(option: string): void {
    this.options.push(option);
  }

  public modify(regExp: string): [string, string] {
    if (this.options.length === 0) {
      throw new Error('Alternation is empty');
    }
    return [`(?:${this.options.join('|')})`, regExp];
  }

  public clone(): AlternationModifier {
    const modifier = new AlternationModifier();
    this.options.forEach(option => modifier.add(option));
    return modifier;
  }
}
