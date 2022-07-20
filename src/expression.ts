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
  toString(): string;
  toRegExp(): RegExp;
}

interface RegexModifier {
  modify(regex: string): string;
  clone(): RegexModifier;
}

class OneOfModifier implements RegexModifier {
  private readonly options: string[] = [];

  public add(option: string): void {
    this.options.push(option);
  }

  public modify(regex: string): string {
    if (this.options.length === 0) throw new Error('No options provided for oneOf');
    return `(?:${this.options.join('|')})${regex}`;
  }

  public clone(): OneOfModifier {
    const modifier = new OneOfModifier();
    this.options.forEach(option => modifier.add(option));
    return modifier;
  }
}

class RegexBuilder implements RegexToken {
  public readonly regex: string;
  public readonly modifiers: RegexModifier[];

  public constructor(regex?: string, modifiers?: RegexModifier[]) {
    this.regex = regex ?? '';
    this.modifiers = modifiers ?? [];
  }

  public executeModifiers(regex?: string): string {
    if (this.modifiers.length === 0) return this.regex + (regex ?? '');
    return this.regex + this.modifiers.reduce((regex, modifier) => modifier.modify(regex), regex ?? '');
  }

  public toString(): string {
    return this.executeModifiers();
  }

  public toRegExp(): RegExp {
    return new RegExp(this.toString());
  }

  /*
   * ========== Internal Functions ==========
   */

  public addNode(node: string): RegexBuilder {
    return new RegexBuilder(this.executeModifiers(node));
  }

  public addModifier(modifier: RegexModifier | ((regex: string) => string)): RegexBuilder {
    let newModifier: RegexModifier | undefined;
    if (modifier instanceof Function) {
      const createModifier = () => ({ modify: modifier, clone: createModifier });
      newModifier = createModifier();
    } else {
      newModifier = modifier;
    }
    return new RegexBuilder(this.regex, [newModifier, ...this.modifiers]);
  }

  public mutateModifier(mutation: (modifier: RegexModifier) => void): RegexToken {
    if (this.modifiers.length === 0) return new RegexBuilder(this.regex);

    const newModifiers = this.modifiers.map(modifier => modifier.clone());
    mutation(newModifiers[0]);
    return new RegexBuilder(this.regex, newModifiers);
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

  public get exactly(): LiteralFunction {
    function func(this: RegexBuilder, ...args: RegexLiteral): RegexToken {
      const literal = getLiteralString(args);
      return this.addNode(literal);
    }
    return func.bind(this);
  }

  public get oneOrMore(): LiteralFunction & ModifierFunction & QuantifiedToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (args[0] instanceof RegexBuilder) {
        return this.addNode(args[0].regex);
      } else {
        throw new Error('Invalid arguments');
      }
    }
    return assign(
      func,
      this.addModifier(regex => `(?:${regex})+`)
    );
  }

  /*
   * ========== Multiple Input ==========
   */

  public get oneOf(): MultiInputFunction {
    function func(
      this: RegexBuilder,
      ...args: RegexLiteral | (string | RegexToken)[]
    ): RegexToken & MultiInputFunction {
      if (!(this.modifiers[0] instanceof OneOfModifier))
        throw new Error(`Unexpected modifier, expected OneOfModifier, but got ${this.modifiers[0]}`);
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return assign(
          func,
          this.mutateModifier(modifier => (modifier as OneOfModifier).add(literal))
        );
      } else {
        return assign(
          func,
          this.mutateModifier(modifier => {
            const mod = modifier as OneOfModifier;
            args.forEach(arg => {
              if (arg instanceof RegexBuilder) {
                mod.add(arg.regex);
              } else if (typeof arg === 'string') {
                mod.add(arg);
              } else {
                throw new Error('Invalid arguments');
              }
            });
          })
        );
      }
    }
    return func.bind(this.addModifier(new OneOfModifier()));
  }
}

export const exactly = new RegexBuilder().exactly as RegexToken['exactly'];
export const char = new RegexBuilder().char;
export const oneOrMore = new RegexBuilder().oneOrMore as RegexToken['oneOrMore'];
export const oneOf = new RegexBuilder().oneOf;
