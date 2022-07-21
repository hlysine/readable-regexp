import { RegexModifier } from '../types';

export enum GroupType {
  NonCapture = 'nonCapture',
  PositiveLookahead = 'positiveLookahead',
  NegativeLookahead = 'negativeLookahead',
  PositiveLookbehind = 'positiveLookbehind',
  NegativeLookbehind = 'negativeLookbehind',
}

export default class GroupModifier implements RegexModifier {
  private readonly groupType: GroupType;

  public constructor(groupType: GroupType) {
    this.groupType = groupType;
  }

  public modify(regex: string): string {
    switch (this.groupType) {
      case GroupType.NonCapture:
        return `(?:${regex})`;
      case GroupType.PositiveLookahead:
        return `(?=${regex})`;
      case GroupType.NegativeLookahead:
        return `(?!${regex})`;
      case GroupType.PositiveLookbehind:
        return `(?<=${regex})`;
      case GroupType.NegativeLookbehind:
        return `(?<!${regex})`;
      default:
        throw new Error('Unknown group type: ' + this.groupType);
    }
  }

  public clone(): GroupModifier {
    return new GroupModifier(this.groupType);
  }
}
