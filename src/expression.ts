import { assign, getLiteralString, isLiteralArgument, RegexLiteral } from './helper';

type LiteralFunction = {
  (literal: string): RegexToken;
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken;
};

type ModifierFunction = {
  (node: RegexToken): RegexToken;
};

type MultiInputFunction = {
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & MultiInputFunction;
  (...args: (string | RegexToken)[]): RegexToken & MultiInputFunction;
};

interface QuantifiedToken {
  get char(): RegexToken;
  exactly: LiteralFunction;
  oneOf: MultiInputFunction;
}

interface RegexToken extends QuantifiedToken {
  oneOrMore: LiteralFunction & ModifierFunction & QuantifiedToken;
}

interface RegexModifier {
  modify(regex: string): string;
}

function combineModifiers(...modifiers: RegexModifier[]): RegexModifier {
  return {
    modify(regex) {
      return modifiers.reduce((regex, modifier) => modifier.modify(regex), regex);
    },
  };
}

class RegexBuilder implements RegexToken {
  public readonly regex: string;
  public readonly modifier?: RegexModifier;

  public constructor(regex?: string, modifier?: RegexModifier) {
    this.regex = regex ?? '';
    this.modifier = modifier;
  }

  /*
   * ========== Internal Functions ==========
   */

  public addNode(node: string): RegexBuilder {
    let newRegex = this.regex;
    if (this.modifier) {
      newRegex += this.modifier.modify(node);
    } else {
      newRegex += node;
    }
    return new RegexBuilder(newRegex);
  }

  public addModifier(modifier: RegexModifier | ((regex: string) => string)): RegexBuilder {
    let newModifier: RegexModifier | undefined;
    if (modifier instanceof Function) {
      newModifier = { modify: modifier };
    } else {
      newModifier = modifier;
    }
    if (this.modifier) {
      newModifier = combineModifiers(newModifier, this.modifier);
    }
    return new RegexBuilder(this.regex, newModifier);
  }

  /*
   * ========== Special Tokens ==========
   */

  public get char(): RegexToken {
    return this.addNode('.');
  }

  /*
   * ========== Single Input ==========
   */

  public exactly = (...args: RegexLiteral): RegexToken => {
    const literal = getLiteralString(args);
    return this.addNode(literal);
  };

  public get oneOrMore(): LiteralFunction & ModifierFunction & QuantifiedToken {
    const func = (...args: RegexLiteral | [RegexToken]): RegexToken => {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(`(?:${literal})*`);
      } else if (args[0] instanceof RegexBuilder) {
        return this.addNode(`(?:${args[0].regex})*`);
      } else {
        throw new Error('Invalid arguments');
      }
    };
    return assign(
      func,
      this.addModifier((regex) => `(?:${regex})*`)
    );
  }

  /*
   * ========== Multiple Input ==========
   */
}

export const exactly = new RegexBuilder().exactly as RegexToken['exactly'];
export const char = new RegexBuilder().char;
export const oneOrMore = new RegexBuilder().oneOrMore as RegexToken['oneOrMore'];
