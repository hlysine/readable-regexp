import {
  CanBeNegated,
  CanBeQuantified,
  GroupFunction,
  LimitFunction,
  LiteralFunction,
  MultiInputFunction,
  NamedCaptureFunction,
  NegatedToken,
  QuantifiedToken,
  QuantifierFunction,
  RegexLiteral,
  RegexModifier,
  RegexToken,
  RepeatFunction,
  TokenFunction,
  negatableSymbol,
  quantifiableSymbol,
} from './types';
import GroupModifier, { GroupType } from './modifiers/GroupModifier';
import { assign, bind, captureName, getLiteralString, isLiteralArgument, unicodeHex } from './helper';
import AlternationModifier from './modifiers/AlternationModifier';
import CaptureModifier from './modifiers/CaptureModifier';
import NegationModifier from './modifiers/NegationModifier';
import RepeatQuantifier from './modifiers/RepeatQuantifier';
import SimpleQuantifier from './modifiers/SimpleQuantifier';

class RegexBuilder implements RegexToken {
  public readonly regex: string;
  public readonly modifiers: RegexModifier[];
  public readonly backreferences: string[];
  public readonly namedGroups: string[];
  public readonly [negatableSymbol]: undefined;
  public readonly [quantifiableSymbol]: undefined;

  public constructor(regex?: string, modifiers?: RegexModifier[], backreferences?: string[], namedGroups?: string[]) {
    this.regex = regex ?? '';
    this.modifiers = modifiers ?? [];
    this.backreferences = backreferences ?? [];
    this.namedGroups = namedGroups ?? [];
  }

  public toString(): string {
    const invalidRefs = this.backreferences.filter(r => !this.namedGroups.includes(r));
    if (invalidRefs.length > 0) {
      throw new Error('The following backreferences are not defined: ' + invalidRefs.join(', '));
    }
    return this.executeModifiers();
  }

  public toRegExp(): RegExp {
    return new RegExp(this.toString());
  }

  /*
   * ========== Internal Functions ==========
   */

  public static isRegexBuilder(obj: unknown): obj is RegexBuilder {
    return (
      obj instanceof RegexBuilder ||
      (typeof obj === 'function' && `regex` in obj && `modifiers` in obj && `executeModifiers` in obj)
    );
  }

  public executeModifiers(regex?: string): string {
    if (this.modifiers.length === 0) return this.regex + (regex ?? '');
    return this.regex + this.modifiers.reduce((r, modifier) => modifier.modify(r), regex ?? '');
  }

  public addNode(node: string, modifyBuilder?: (regex: RegexBuilder) => void): RegexBuilder {
    const builder = new RegexBuilder(
      this.executeModifiers(node),
      undefined,
      this.backreferences.slice(),
      this.namedGroups.slice()
    );
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public addModifier(modifier: RegexModifier, modifyBuilder?: (regex: RegexBuilder) => void): RegexBuilder {
    const builder = new RegexBuilder(
      this.regex,
      [modifier, ...this.modifiers],
      this.backreferences.slice(),
      this.namedGroups.slice()
    );
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public mutateModifier(
    mutation: (modifier: RegexModifier) => void,
    modifyBuilder?: (regex: RegexBuilder) => void
  ): RegexBuilder {
    if (this.modifiers.length === 0)
      return new RegexBuilder(this.regex, undefined, this.backreferences.slice(), this.namedGroups.slice());

    const newModifiers = this.modifiers.map(modifier => modifier.clone());
    mutation(newModifiers[0]);
    const builder = new RegexBuilder(this.regex, newModifiers, this.backreferences.slice(), this.namedGroups.slice());
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
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
      if (RegexBuilder.isRegexBuilder(token)) {
        return this.addNode(token.executeModifiers());
      } else {
        throw new Error('Invalid arguments for not');
      }
    }
    return assign(func, this.addModifier(new NegationModifier()));
  }

  public get repeat(): RepeatFunction {
    function configure(
      this: RegexBuilder,
      min: number,
      max?: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for repeat');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(min, max ?? min)));
    }
    return bind(configure, this);
  }

  public get atLeast(): LimitFunction {
    function configure(
      this: RegexBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for atLeast');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(limit, null)));
    }
    return bind(configure, this);
  }

  public get atMost(): LimitFunction {
    function configure(
      this: RegexBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for atMost');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(null, limit)));
    }
    return bind(configure, this);
  }

  public get maybe(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for maybe');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regex => `${regex}?`)));
  }

  public get zeroOrMore(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for zeroOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regex => `${regex}*`)));
  }

  public get oneOrMore(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for oneOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regex => `${regex}+`)));
  }

  public get capture(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken & CanBeQuantified {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for capture');
      }
    }
    return assign(func, this.addModifier(new CaptureModifier()));
  }

  public get captureAs(): NamedCaptureFunction & CanBeQuantified {
    function configure(
      this: RegexBuilder,
      ...configArgs: RegexLiteral
    ): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken {
      if (!isLiteralArgument(configArgs)) {
        throw new Error('Invalid arguments for captureAs');
      }
      const name = getLiteralString(configArgs);
      if (!captureName.test(name))
        throw new Error('Invalid capture name. It must be alpha numeric and must not begin with a digit');
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for captureAs');
        }
      }
      return assign(
        func,
        this.addModifier(new CaptureModifier(name), builder => builder.namedGroups.push(name))
      );
    }
    return bind(configure, this);
  }

  public get ref(): LiteralFunction<CanBeQuantified> & CanBeQuantified {
    function func(this: RegexBuilder, ...args: RegexLiteral): RegexToken & CanBeQuantified {
      const literal = getLiteralString(args);
      if (!captureName.test(literal))
        throw new Error('Invalid capture name. It must be alpha numeric and must not begin with a digit');
      return this.addNode(`\\k<${literal}>`, builder => builder.backreferences.push(literal));
    }
    return bind(func, this);
  }

  public get group(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken & CanBeQuantified {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.NonCapture)));
  }

  public get ahead(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookahead)));
  }

  public get behind(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookbehind)));
  }

  public get notAhead(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.NegativeLookahead)));
  }

  public get notBehind(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.NegativeLookbehind)));
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
              if (RegexBuilder.isRegexBuilder(arg)) {
                mod.add(arg.executeModifiers());
              } else if (typeof arg === 'string') {
                mod.add(arg);
              } else {
                throw new Error('Invalid arguments for oneOf');
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
export const repeat = new RegexBuilder().repeat;
export const atLeast = new RegexBuilder().atLeast;
export const atMost = new RegexBuilder().atMost;
export const maybe = new RegexBuilder().maybe;
export const zeroOrMore = new RegexBuilder().zeroOrMore;
export const oneOrMore = new RegexBuilder().oneOrMore;
export const capture = new RegexBuilder().capture;
export const captureAs = new RegexBuilder().captureAs;
export const ref = new RegexBuilder().ref;
export const group = new RegexBuilder().group;
export const ahead = new RegexBuilder().ahead;
export const behind = new RegexBuilder().behind;
export const notAhead = new RegexBuilder().notAhead;
export const notBehind = new RegexBuilder().notBehind;

export const oneOf = new RegexBuilder().oneOf;
