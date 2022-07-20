import { assign, bind, getLiteralString, isLiteralArgument } from './helper';
import {
  LiteralFunction,
  TokenFunction,
  MultiInputFunction,
  NegatableTokenTag,
  NegatedToken,
  QuantifiedToken,
  RegexLiteral,
  RegexModifier,
  RegexToken,
  QuantifiableTokenTag,
  negatableTokenSymbol,
  quantifiableTokenSymbol,
} from './types';

class AlternationModifier implements RegexModifier {
  private readonly options: string[] = [];

  public add(option: string): void {
    this.options.push(option);
  }

  public modify(regex: string): string {
    if (this.options.length === 0) throw new Error('No options provided for oneOf');
    return `(?:${this.options.join('|')})${regex}`;
  }

  public clone(): AlternationModifier {
    const modifier = new AlternationModifier();
    this.options.forEach(option => modifier.add(option));
    return modifier;
  }
}

class RegexBuilder implements RegexToken {
  public readonly regex: string;
  public readonly modifiers: RegexModifier[];
  public readonly [negatableTokenSymbol]: undefined;
  public readonly [quantifiableTokenSymbol]: undefined;

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

  public get char(): RegexToken & QuantifiableTokenTag {
    return this.addNode('.');
  }

  public get whitespace(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\s');
  }

  public get digit(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\d');
  }

  public get word(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\w');
  }

  public get verticalWhitespace(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\v');
  }

  public get lineFeed(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\n');
  }

  public get carriageReturn(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\r');
  }

  public get tab(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\t');
  }

  public get nullChar(): RegexToken & NegatableTokenTag & QuantifiableTokenTag {
    return this.addNode('\\0');
  }

  public get lineStart(): RegexToken & NegatableTokenTag {
    return this.addNode('^');
  }

  /*
   * ========== Single Input ==========
   */

  public get exactly(): LiteralFunction & QuantifiableTokenTag {
    function func(this: RegexBuilder, ...args: RegexLiteral): RegexToken {
      const literal = getLiteralString(args);
      return this.addNode(literal);
    }
    return bind(func, this);
  }

  public get not(): TokenFunction<NegatableTokenTag> & NegatedToken & QuantifiableTokenTag {
    function func(this: RegexBuilder, token: RegexToken & NegatableTokenTag): RegexToken {
      if (token instanceof RegexBuilder) {
        return this.addNode(token.regex);
      } else {
        throw new Error('Invalid arguments');
      }
    }
    return assign(
      func,
      this.addModifier(regex => {
        switch (regex) {
          case '\\v':
          case '\\n':
          case '\\r':
          case '\\t':
          case '\\0':
            return `[^${regex}]`;
          case '^':
          case '$':
            return `(?!${regex})`;
          default:
            if (regex.startsWith('\\p')) {
              return '\\P' + regex.slice(2);
            } else if (regex.length === 2 && regex.startsWith('\\')) {
              return regex.toUpperCase();
            } else {
              throw new Error('The provided token is not negatable');
            }
        }
      })
    );
  }

  public get oneOrMore(): LiteralFunction & TokenFunction & QuantifiedToken {
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

  public get oneOf(): MultiInputFunction & QuantifiableTokenTag {
    function func(
      this: RegexBuilder,
      ...args: RegexLiteral | (string | RegexToken)[]
    ): RegexToken & MultiInputFunction {
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

export const exactly = new RegexBuilder().exactly;
export const not = new RegexBuilder().not;
export const oneOrMore = new RegexBuilder().oneOrMore;

export const oneOf = new RegexBuilder().oneOf;
