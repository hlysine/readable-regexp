import { RegexModifier } from '../types';

export default class CaptureModifier implements RegexModifier {
  private readonly name: string | undefined;

  public constructor(name?: string) {
    this.name = name;
  }

  public modify(regex: string): [string, string?] {
    if (this.name === undefined) return [`(${regex})`];
    return [`(?<${this.name}>${regex})`];
  }

  public clone(): CaptureModifier {
    return new CaptureModifier();
  }
}
