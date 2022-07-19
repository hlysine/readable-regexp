import { assign, getLiteralString, isLiteralArgument, RegexLiteral } from './helper';

type RegexModifier = (regex: string) => string;

type LiteralFunction = {
  (literal: string | number): RegexExpression;
  (template: TemplateStringsArray, ...args: unknown[]): RegexExpression;
};

type ModifierFunction = {
  (node: RegexExpression): RegexExpression;
};

interface ModifiedExpression {
  get char(): RegexExpression;
  exactly: LiteralFunction;
}

interface RegexExpression extends ModifiedExpression {
  oneOrMore: LiteralFunction & ModifierFunction & ModifiedExpression;
}

class InternalExpression implements RegexExpression {
  public readonly regex: string;
  public readonly modifier?: RegexModifier;

  public constructor(regex?: string, modifier?: RegexModifier) {
    this.regex = regex ?? '';
    this.modifier = modifier;
  }

  /*
   * ========== Internals ==========
   */

  public addNode(node: string): InternalExpression {
    let newRegex = this.regex;
    if (this.modifier) {
      newRegex += this.modifier(node);
    } else {
      newRegex += node;
    }
    return new InternalExpression(newRegex);
  }

  public addModifier(modifier: RegexModifier): InternalExpression {
    let newModifier: RegexModifier | undefined;
    if (this.modifier) {
      newModifier = (regex: string) => this.modifier?.(modifier(regex)) ?? modifier(regex);
    } else {
      newModifier = modifier;
    }
    return new InternalExpression(this.regex, newModifier);
  }

  /*
   * ========== Special Tokens ==========
   */

  public get char(): RegexExpression {
    return this.addNode('.');
  }

  /*
   * ========== Single Input ==========
   */

  public exactly = (...args: RegexLiteral): RegexExpression => {
    const literal = getLiteralString(args);
    return this.addNode(literal);
  };

  public get oneOrMore(): LiteralFunction & ModifierFunction & ModifiedExpression {
    const func = (...args: RegexLiteral | [RegexExpression]): RegexExpression => {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(`(?:${literal})*`);
      } else if (args[0] instanceof InternalExpression) {
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

export const exactly = new InternalExpression().exactly as RegexExpression['exactly'];
export const char = new InternalExpression().char;
export const oneOrMore = new InternalExpression().oneOrMore as RegexExpression['oneOrMore'];
