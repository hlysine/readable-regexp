import { RegExpModifier } from '../types';

export enum GroupType {
  NonCapture = 'nonCapture',
  PositiveLookahead = 'positiveLookahead',
  NegativeLookahead = 'negativeLookahead',
  PositiveLookbehind = 'positiveLookbehind',
  NegativeLookbehind = 'negativeLookbehind',
}

export default class GroupModifier implements RegExpModifier {
  private readonly groupType: GroupType;

  public constructor(groupType: GroupType) {
    this.groupType = groupType;
  }

  public modify(regExp: string): [string, string?] {
    switch (this.groupType) {
      case GroupType.NonCapture:
        return [`(?:${regExp})`];
      case GroupType.PositiveLookahead:
        return [`(?=${regExp})`];
      case GroupType.NegativeLookahead:
        return [`(?!${regExp})`];
      case GroupType.PositiveLookbehind:
        return [`(?<=${regExp})`];
      case GroupType.NegativeLookbehind:
        return [`(?<!${regExp})`];
      default:
        throw new Error('Unknown group type: ' + this.groupType);
    }
  }

  public clone(): GroupModifier {
    return new GroupModifier(this.groupType);
  }
}
