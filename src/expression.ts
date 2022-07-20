import {
  CanBeNegated,
  CanBeQuantified,
  LiteralFunction,
  MultiInputFunction,
  NegatedToken,
  QuantifiedToken,
  QuantifierFunction,
  RegexLiteral,
  RegexModifier,
  RegexToken,
  TokenFunction,
  negatableSymbol,
  quantifiableSymbol,
} from './types';
import { assign, bind, getLiteralString, isLiteralArgument, unicodeHex } from './helper';
import AlternationModifier from './modifiers/AlternationModifier';
import NegationModifier from './modifiers/NegationModifier';
import OneOrMoreQuantifier from './modifiers/OneOrMoreQuantifier';

class RegexBuilder implements RegexToken {
  public readonly regex: string;
  public readonly modifiers: RegexModifier[];
  public readonly [negatableSymbol]: undefined;
  public readonly [quantifiableSymbol]: undefined;

  public constructor(regex?: string, modifiers?: RegexModifier[]) {
    this.regex = regex ?? '';
    this.modifiers = modifiers ?? [];
  }

  public executeModifiers(regex?: string): string {
    if (this.modifiers.length === 0) return this.regex + (regex ?? '');
    return this.regex + this.modifiers.reduce((r, modifier) => modifier.modify(r), regex ?? '');
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

  public addModifier(modifier: RegexModifier): RegexBuilder {
    return new RegexBuilder(this.regex, [modifier, ...this.modifiers]);
  }

  public mutateModifier(mutation: (modifier: RegexModifier) => void): RegexBuilder {
    if (this.modifiers.length === 0) return new RegexBuilder(this.regex);

    const newModifiers = this.modifiers.map(modifier => modifier.clone());
    mutation(newModifiers[0]);
    return new RegexBuilder(this.regex, newModifiers);
  }

  /*
   * ========== Special Tokens ==========
   */

  public get char(): RegexToken & CanBeQuantified {
    return this.addNode('.');
  }

  public get whitespace(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\s');
  }

  public get digit(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\d');
  }

  public get word(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\w');
  }

  public get verticalWhitespace(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\v');
  }

  public get lineFeed(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\n');
  }

  public get carriageReturn(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\r');
  }

  public get tab(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\t');
  }

  public get nullChar(): RegexToken & CanBeNegated & CanBeQuantified {
    return this.addNode('\\0');
  }

  public get lineStart(): RegexToken & CanBeNegated {
    return this.addNode('^');
  }

  public get lineEnd(): RegexToken & CanBeNegated {
    return this.addNode('$');
  }

  public get wordBoundary(): RegexToken & CanBeNegated {
    return this.addNode('\\b');
  }

  /*
   * ========== Single Input ==========
   */

  public get exactly(): LiteralFunction<CanBeQuantified> & CanBeQuantified {
    function func(this: RegexBuilder, ...args: RegexLiteral): RegexToken & CanBeQuantified {
      const literal = getLiteralString(args);
      return this.addNode(literal);
    }
    return bind(func, this);
  }

  public get unicode(): LiteralFunction<CanBeQuantified & CanBeNegated> & CanBeQuantified & CanBeNegated {
    function func(this: RegexBuilder, ...args: RegexLiteral): RegexToken & CanBeQuantified & CanBeNegated {
      const literal = getLiteralString(args);
      if (!unicodeHex.test(literal)) throw new Error('Invalid unicode literal');
      return this.addNode(`\\u${literal}`);
    }
    return bind(func, this);
  }

  public get not(): TokenFunction<CanBeNegated> & NegatedToken & CanBeQuantified {
    function func(this: RegexBuilder, token: RegexToken & CanBeNegated): RegexToken & CanBeQuantified {
      if (token instanceof RegexBuilder) {
        return this.addNode(token.regex);
      } else {
        throw new Error('Invalid arguments');
      }
    }
    return assign(func, this.addModifier(new NegationModifier()));
  }

  public get oneOrMore(): LiteralFunction & QuantifierFunction & QuantifiedToken {
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
    return assign(func, this.addModifier(new OneOrMoreQuantifier()));
  }

  /*
   * ========== Multiple Input ==========
   */

  public get oneOf(): MultiInputFunction & CanBeQuantified {
    function func(
      this: RegexBuilder,
      ...args: RegexLiteral | (string | RegexToken)[]
    ): RegexToken & CanBeQuantified & MultiInputFunction {
      if (!(this.modifiers[0] instanceof AlternationModifier))
        throw new Error(`Unexpected modifier, expected OneOfModifier, but got ${this.modifiers[0]}`);
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return assign(
          func,
          this.mutateModifier(modifier => (modifier as AlternationModifier).add(literal))
        );
      } else {
        return assign(
          func,
          this.mutateModifier(modifier => {
            const mod = modifier as AlternationModifier;
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
    return bind(func, this.addModifier(new AlternationModifier()));
  }
}

export const char = new RegexBuilder().char;
export const whitespace = new RegexBuilder().whitespace;
export const digit = new RegexBuilder().digit;
export const word = new RegexBuilder().word;
export const verticalWhitespace = new RegexBuilder().verticalWhitespace;
export const lineFeed = new RegexBuilder().lineFeed;
export const carriageReturn = new RegexBuilder().carriageReturn;
export const tab = new RegexBuilder().tab;
export const nullChar = new RegexBuilder().nullChar;

export const lineStart = new RegexBuilder().lineStart;
export const lineEnd = new RegexBuilder().lineEnd;
export const wordBoundary = new RegexBuilder().wordBoundary;

export const exactly = new RegexBuilder().exactly;
export const unicode = new RegexBuilder().unicode;
export const not = new RegexBuilder().not;
export const oneOrMore = new RegexBuilder().oneOrMore;

export const oneOf = new RegexBuilder().oneOf;
