import { RegexModifier } from '../types';
import { isBracketGroup } from '../helper';

export default class CaptureModifier implements RegexModifier {
  private readonly name: string | undefined;

  public constructor(name?: string) {
    this.name = name;
  }

  public modify(regex: string): [string, string?] {
    if (isBracketGroup(regex) && regex.startsWith('(?:')) {
      if (this.name === undefined) return ['(' + regex.substring(3)];
      return [`(?<${this.name}>` + regex.substring(3)];
    }
    if (this.name === undefined) return [`(${regex})`];
    return [`(?<${this.name}>${regex})`];
  }

  public clone(): CaptureModifier {
    return new CaptureModifier(this.name);
  }
}
