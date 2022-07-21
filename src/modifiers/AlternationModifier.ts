import { RegexModifier } from '../types';

export default class AlternationModifier implements RegexModifier {
  private readonly options: string[] = [];

  public add(option: string): void {
    this.options.push(option);
  }

  public modify(regex: string): [string, string] {
    if (this.options.length === 0) return ['(?:)', regex];
    return [`(?:${this.options.join('|')})`, regex];
  }

  public clone(): AlternationModifier {
    const modifier = new AlternationModifier();
    this.options.forEach(option => modifier.add(option));
    return modifier;
  }
}
