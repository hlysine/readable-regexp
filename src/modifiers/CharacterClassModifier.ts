import { RegExpModifier } from '../types';
import { countTail, escapeForCharClass } from '../helper';

export default class CharacterClassModifier implements RegExpModifier {
  private readonly options: string[] = [];
  private readonly negative: boolean;

  public constructor(negative: boolean) {
    this.negative = negative;
  }

  public add(option: string): void {
    this.options.push(option);
  }

  public modify(regExp: string): [string, string?] {
    if (this.options.length === 0) {
      return [this.negative ? '[^]' : '[]', regExp];
    }
    let combined = this.options.map(escapeForCharClass).join('');
    if (combined.startsWith('\\-')) {
      combined = '-' + combined.substring(2);
    }
    if (combined.endsWith('\\-')) {
      const before = countTail(combined.slice(0, -2), '\\');
      if (before % 2 === 0) {
        combined = combined.slice(0, -2) + '-';
      }
    }
    if (countTail(combined, '\\') % 2 === 1) {
      combined += '\\';
    }
    return [`[${this.negative ? '^' : ''}${combined}]`, regExp];
  }

  public clone(): CharacterClassModifier {
    const modifier = new CharacterClassModifier(this.negative);
    this.options.forEach(option => modifier.add(option));
    return modifier;
  }
}
