import { RegExpModifier } from '../types';

function escapeForCharClass(option: string): string {
  if (option.startsWith('-')) {
    option = '\\-' + option.substring(1);
  }
  if (option.endsWith('-')) {
    option = option.substring(0, option.length - 1) + '\\-';
  }
  let charEscaped = false;
  for (let i = 0; i < option.length; i++) {
    const char = option[i];
    if (charEscaped) {
      charEscaped = false;
    } else if (char === '\\') {
      charEscaped = true;
    } else if (char === ']' || char === '^') {
      // escape this character
      option = option.substring(0, i) + '\\' + option.substring(i);
      charEscaped = true;
    }
  }
  return option;
}

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
      if (this.negative) {
        return ['[^]', regExp];
      } else {
        throw new Error('Character class is empty and is not negated');
      }
    }
    let combined = this.options.map(escapeForCharClass).join('');
    if (combined.startsWith('\\-')) {
      combined = '-' + combined.substring(2);
    }
    if (combined.endsWith('\\-')) {
      combined = combined.substring(0, combined.length - 2) + '-';
    }
    return [`[${this.negative ? '^' : ''}${combined}]`, regExp];
  }

  public clone(): CharacterClassModifier {
    const modifier = new CharacterClassModifier(this.negative);
    this.options.forEach(option => modifier.add(option));
    return modifier;
  }
}
