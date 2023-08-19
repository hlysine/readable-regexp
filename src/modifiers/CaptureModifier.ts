import { RegExpModifier } from '../types';
import { isBracketGroup } from '../helper';

export default class CaptureModifier implements RegExpModifier {
  private readonly name: string | undefined;

  public constructor(name?: string) {
    this.name = name;
  }

  public modify(regExp: string): [string, string?] {
    if (regExp.length === 0) throw new Error('Empty capture group');
    if (isBracketGroup(regExp) && regExp.startsWith('(?:')) {
      if (this.name === undefined) return ['(' + regExp.substring(3)];
      return [`(?<${this.name}>` + regExp.substring(3)];
    }
    if (this.name === undefined) return [`(${regExp})`];
    return [`(?<${this.name}>${regExp})`];
  }

  public clone(): CaptureModifier {
    return new CaptureModifier(this.name);
  }
}
