import {
  AlternationFunction,
  CharClassFunction,
  FlagUnion,
  FlagsString,
  GenericFunction,
  GroupFunction,
  IncompleteToken,
  LiteralFunction,
  RegExpLiteral,
  RegExpModifier,
  RegExpToken,
  TokenFunction,
} from './types';
import {
  assign,
  bindAsIncomplete,
  captureName,
  compareCodePoint,
  escapeForCharClass,
  flagString,
  getLiteralString,
  hexNumber,
  isCharacterClass,
  isLiteralArgument,
  octalNumber,
} from './helper';
import AlternationModifier from './modifiers/AlternationModifier';
import CaptureModifier from './modifiers/CaptureModifier';
import CharacterClassModifier from './modifiers/CharacterClassModifier';
import GroupModifier, { GroupType } from './modifiers/GroupModifier';
import NegationModifier from './modifiers/NegationModifier';
import QuantityModifier from './modifiers/QuantityModifier';
import RepeatQuantifier from './modifiers/RepeatQuantifier';
import SimpleQuantifier from './modifiers/SimpleQuantifier';

class RegExpBuilder implements RegExpToken {
  public readonly regExp: string;
  public readonly modifiers: RegExpModifier[];
  public readonly backreferences: (string | number)[];
  public readonly namedGroups: (string | number)[];

  public constructor(
    regExp?: string,
    modifiers?: RegExpModifier[],
    backreferences?: (string | number)[],
    namedGroups?: (string | number)[]
  ) {
    this.regExp = regExp ?? '';
    this.modifiers = modifiers ?? [];
    this.backreferences = backreferences ?? [];
    this.namedGroups = namedGroups ?? [];
  }

  public toString(): string {
    const indexedGroups = this.namedGroups.filter(re => typeof re === 'number').length;
    const invalidRefs = this.backreferences.filter(re => {
      if (typeof re === 'number') return re > indexedGroups;
      else return !this.namedGroups.includes(re);
    });
    if (invalidRefs.length > 0) {
      throw new Error('The following backreferences are not defined: ' + invalidRefs.join(', '));
    }
    const duplicateNames = this.namedGroups
      .filter(re => typeof re === 'string')
      .filter((re, i) => this.namedGroups.indexOf(re) !== i)
      .filter((re, i) => this.namedGroups.indexOf(re) === i);
    if (duplicateNames.length > 0) {
      throw new Error('The following named groups are defined more than once: ' + duplicateNames.join(', '));
    }

    return this.executeModifiers();
  }

  public toRegExp<TFlag extends string>(
    ...flags: [(FlagsString<TFlag> & TFlag)?] | FlagUnion[] | [TemplateStringsArray, ...unknown[]]
  ): RegExp {
    let fl: string | undefined;
    if (isLiteralArgument(flags)) {
      fl = getLiteralString(flags);
    } else if (flags.length > 0) {
      fl = flags.join('');
    }
    if (fl && !flagString.test(fl)) throw new Error('Invalid flags: ' + flags);
    return new RegExp(this.toString(), fl);
  }

  /*
   * ========== Internal Functions ==========
   */

  public static isRegExpBuilder(obj: unknown): obj is RegExpBuilder {
    return (
      !!obj &&
      (obj instanceof RegExpBuilder ||
        (typeof obj === 'function' && `regExp` in obj && `modifiers` in obj && `executeModifiers` in obj))
    );
  }

  public executeModifiers(regExp?: string): string {
    if (this.modifiers.length === 0) return this.regExp + (regExp ?? '');
    return (
      this.regExp +
      this.modifiers
        .reduce(
          (re, modifier) => {
            const [processed, trailing] = modifier.modify(re[0]);
            return [processed, (trailing ?? '') + re[1]];
          },
          [regExp ?? '', '']
        )
        .join('')
    );
  }

  public addNode(node: string | RegExpBuilder, modifyBuilder?: (regExp: RegExpBuilder) => void): RegExpBuilder {
    let builder: RegExpBuilder;
    if (typeof node === 'string') {
      builder = new RegExpBuilder(
        this.executeModifiers(node),
        undefined,
        this.backreferences.slice(),
        this.namedGroups.slice()
      );
    } else {
      builder = new RegExpBuilder(
        this.executeModifiers(node.executeModifiers()),
        undefined,
        [...this.backreferences, ...node.backreferences],
        [...this.namedGroups, ...node.namedGroups]
      );
    }

    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public addModifier(modifier: RegExpModifier, modifyBuilder?: (regExp: RegExpBuilder) => void): RegExpBuilder {
    const builder = new RegExpBuilder(
      this.regExp,
      [modifier, ...this.modifiers],
      this.backreferences.slice(),
      this.namedGroups.slice()
    );
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public mutateModifier(
    mutation: (modifier: RegExpModifier) => void,
    modifyBuilder?: (regExp: RegExpBuilder) => void
  ): RegExpBuilder {
    if (this.modifiers.length === 0) {
      throw new Error(
        "No modifiers to mutate. This probably means you are using a token that shouldn't be used alone."
      );
    }

    const newModifiers = this.modifiers.map(modifier => modifier.clone());
    mutation(newModifiers[0]);
    const builder = new RegExpBuilder(this.regExp, newModifiers, this.backreferences.slice(), this.namedGroups.slice());
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  /*
   * ========== Special Tokens ==========
   */

  public get char(): RegExpToken['char'] {
    return this.addNode('.');
  }

  public get whitespace(): RegExpToken['whitespace'] {
    return this.addNode('\\s');
  }

  public get digit(): RegExpToken['digit'] {
    return this.addNode('\\d');
  }

  public get word(): RegExpToken['word'] {
    return this.addNode('\\w');
  }

  public get verticalWhitespace(): RegExpToken['verticalWhitespace'] {
    return this.addNode('\\v');
  }

  public get backspace(): RegExpToken['backspace'] {
    return this.addNode('[\\b]');
  }

  public get lineFeed(): RegExpToken['lineFeed'] {
    return this.addNode('\\n');
  }

  public get formFeed(): RegExpToken['formFeed'] {
    return this.addNode('\\f');
  }

  public get carriageReturn(): RegExpToken['carriageReturn'] {
    return this.addNode('\\r');
  }

  public get tab(): RegExpToken['tab'] {
    return this.addNode('\\t');
  }

  public get nullChar(): RegExpToken['nullChar'] {
    return this.addNode('\\0');
  }

  public get lineStart(): RegExpToken['lineStart'] {
    return this.addNode('^');
  }

  public get lineEnd(): RegExpToken['lineEnd'] {
    return this.addNode('$');
  }

  public get wordBoundary(): RegExpToken['wordBoundary'] {
    return this.addNode('\\b');
  }

  public get exactly(): RegExpToken['exactly'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken {
      if (!isLiteralArgument(args)) throw new Error('Invalid arguments for exactly');
      const literal = getLiteralString(args);
      return this.addNode(literal);
    }
    return bindAsIncomplete(func, this, 'exactly');
  }

  public get octal(): RegExpToken['octal'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken {
      const literal = getLiteralString(args, false);
      if (!octalNumber.test(literal)) throw new Error('Invalid octal character');
      const num = Number.parseInt(literal, 8);
      if (Number.isNaN(num) || num > 0o777 || num < 0) throw new Error('Invalid octal character');
      if (num > 0o377) {
        // octal literals larger than 1 byte can be parsed by the regexp engine when they exist alone,
        // but they don't work in character classes, and hence cannot be negated.
        throw new Error(
          'Octal literals above 0o377 have inconsistent behavior. Please use hex/unicode literals instead'
        );
      }
      return this.addNode(`[\\${num.toString(8)}]`);
    }
    return bindAsIncomplete(func, this, 'octal');
  }

  public get hex(): RegExpToken['hex'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken {
      const literal = getLiteralString(args, false);
      if (!hexNumber.test(literal)) throw new Error('Invalid hex character');
      const num = Number.parseInt(literal, 16);
      if (Number.isNaN(num) || num > 0xffff || num < 0) throw new Error('Invalid hex character');
      if (num <= 0xff) return this.addNode(`\\x${num.toString(16).padStart(2, '0')}`);
      else return this.addNode(`\\u${num.toString(16).padStart(4, '0')}`);
    }
    return bindAsIncomplete(func, this, 'hex');
  }

  public get unicode(): RegExpToken['unicode'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken {
      const literal = getLiteralString(args, false);
      if (!hexNumber.test(literal)) throw new Error('Invalid unicode character');
      const num = Number.parseInt(literal, 16);
      if (Number.isNaN(num) || num > 0xffff || num < 0) throw new Error('Invalid unicode character');
      return this.addNode(`\\u${num.toString(16).padStart(4, '0')}`);
    }
    return bindAsIncomplete(func, this, 'unicode');
  }

  public get charIn(): RegExpToken['charIn'] {
    function func(
      this: RegExpBuilder,
      ...args: RegExpLiteral | (string | RegExpToken)[]
    ): RegExpToken & CharClassFunction {
      function extractIfCharClass(regExp: string): string {
        if (!isCharacterClass(regExp)) return regExp; // this is not supported behavior but we won't throw an error
        if (regExp.startsWith('[^')) throw new Error('Merging a negated character class is not supported');
        return escapeForCharClass(regExp.slice(1, -1));
      }
      if (!(this.modifiers[0] instanceof CharacterClassModifier))
        throw new Error(
          `Unexpected modifier, expected CharacterClassModifier, but got ${this.modifiers[0]}. This is probably a bug.`
        );
      if (isLiteralArgument(args)) {
        const [str, ...rest] = args;
        const literal = getLiteralString(
          [
            str,
            ...rest.map(arg => (RegExpBuilder.isRegExpBuilder(arg) ? extractIfCharClass(arg.executeModifiers()) : arg)),
          ] as RegExpLiteral,
          false
        );
        return assign(
          func,
          this.mutateModifier(modifier => (modifier as CharacterClassModifier).add(literal))
        );
      } else {
        return assign(
          func,
          this.mutateModifier(modifier => {
            const mod = modifier as CharacterClassModifier;
            args.forEach(arg => {
              if (RegExpBuilder.isRegExpBuilder(arg)) {
                mod.add(extractIfCharClass(arg.executeModifiers()));
              } else if (typeof arg === 'string') {
                mod.add(arg);
              } else {
                throw new Error('Invalid arguments for charIn');
              }
            });
          })
        );
      }
    }
    return bindAsIncomplete(func, this.addModifier(new CharacterClassModifier(false)), 'charIn');
  }

  public get notCharIn(): RegExpToken['notCharIn'] {
    return this.not.charIn;
  }

  public get charRange(): RegExpToken['charRange'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [start: string, end: string]) {
      const continuation = (start: string) =>
        function func2(this: RegExpBuilder, ...args2: RegExpLiteral): RegExpToken {
          if (isLiteralArgument(args2)) {
            const end = getLiteralString(args2, false);
            if (compareCodePoint(start, end) > 0) throw new Error(`Invalid charRange: ${start} > ${end}`);
            return this.charIn`${start === '\\' ? '\\\\' : start}-${end}`;
          } else {
            throw new Error('Invalid second argument for charRange');
          }
        };
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args, false);
        return bindAsIncomplete(continuation(literal), this, 'charRange');
      } else if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
        const [start, end] = args;
        if (compareCodePoint(start, end) > 0) throw new Error(`Invalid charRange: ${start} > ${end}`);
        return this.charIn`${start === '\\' ? '\\\\' : start}-${end}`;
      } else {
        throw new Error('Invalid arguments for charRange');
      }
    }
    return bindAsIncomplete(func, this, 'charRange') as RegExpToken['charRange'];
  }

  public get notCharRange(): RegExpToken['notCharRange'] {
    return this.not.charRange;
  }

  public get not(): RegExpToken['not'] {
    function func(this: RegExpBuilder, token: RegExpToken): RegExpToken {
      if (RegExpBuilder.isRegExpBuilder(token)) {
        return this.addNode(token);
      } else {
        throw new Error('Invalid arguments for not');
      }
    }
    return assign(func, this.addModifier(new NegationModifier()));
  }

  /*
   * ========== Quantifiers ==========
   */

  public get repeat(): RegExpToken['repeat'] {
    function configure(this: RegExpBuilder, min: number, max?: number): LiteralFunction & TokenFunction & RegExpToken {
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
        } else {
          throw new Error('Invalid arguments for repeat');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(min, max ?? min)));
    }
    return bindAsIncomplete(configure, this, 'repeat');
  }

  public get repeatLazily(): RegExpToken['repeatLazily'] {
    function configure(this: RegExpBuilder, min: number, max?: number): LiteralFunction & TokenFunction & RegExpToken {
      return this.repeat(min, max).lazily;
    }
    return bindAsIncomplete(configure, this, 'repeatLazily');
  }

  public get atLeast(): RegExpToken['atLeast'] {
    function configure(this: RegExpBuilder, limit: number): LiteralFunction & TokenFunction & RegExpToken {
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
        } else {
          throw new Error('Invalid arguments for atLeast');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(limit, undefined)));
    }
    return bindAsIncomplete(configure, this, 'atLeast');
  }

  public get atLeastLazily(): RegExpToken['atLeastLazily'] {
    function configure(this: RegExpBuilder, limit: number): LiteralFunction & TokenFunction & RegExpToken {
      return this.atLeast(limit).lazily;
    }
    return bindAsIncomplete(configure, this, 'atLeastLazily');
  }

  public get atMost(): RegExpToken['atMost'] {
    function configure(this: RegExpBuilder, limit: number): LiteralFunction & TokenFunction & RegExpToken {
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
        } else {
          throw new Error('Invalid arguments for atMost');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(undefined, limit)));
    }
    return bindAsIncomplete(configure, this, 'atMost');
  }

  public get atMostLazily(): RegExpToken['atMostLazily'] {
    function configure(this: RegExpBuilder, limit: number): LiteralFunction & TokenFunction & RegExpToken {
      return this.atMost(limit).lazily;
    }
    return bindAsIncomplete(configure, this, 'atMostLazily');
  }

  public get maybe(): RegExpToken['maybe'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for maybe');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regExp => `${regExp}?`)));
  }

  public get maybeLazily(): RegExpToken['maybeLazily'] {
    return this.maybe.lazily;
  }

  public get zeroOrMore(): RegExpToken['zeroOrMore'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for zeroOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regExp => `${regExp}*`)));
  }

  public get zeroOrMoreLazily(): RegExpToken['zeroOrMoreLazily'] {
    return this.zeroOrMore.lazily;
  }

  public get oneOrMore(): RegExpToken['oneOrMore'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for oneOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regExp => `${regExp}+`)));
  }

  public get oneOrMoreLazily(): RegExpToken['oneOrMoreLazily'] {
    return this.oneOrMore.lazily;
  }

  public get lazily(): RegExpToken['lazily'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for oneOrMore');
      }
    }
    return assign(
      func,
      this.mutateModifier(modifier => {
        if (!(modifier instanceof QuantityModifier)) throw new Error('lazily can only be used with quantifiers');
        modifier.lazy = true;
      })
    );
  }

  /*
   * ========== Groups ==========
   */

  public get capture(): RegExpToken['capture'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for capture');
      }
    }
    return assign(
      func,
      this.addModifier(new CaptureModifier(), builder => builder.namedGroups.push(0))
    );
  }

  public get captureAs(): RegExpToken['captureAs'] {
    function configure(
      this: RegExpBuilder,
      ...configArgs: RegExpLiteral
    ): LiteralFunction & GroupFunction & RegExpToken {
      if (!isLiteralArgument(configArgs)) {
        throw new Error('Invalid arguments for captureAs');
      }
      const name = getLiteralString(configArgs);
      if (!captureName.test(name))
        throw new Error('Invalid capture name. It must be alpha numeric and must not begin with a digit');
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken {
        if (args.length === 0) {
          return this.addNode('');
        } else if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
        } else {
          throw new Error('Invalid arguments for captureAs');
        }
      }
      return assign(
        func,
        this.addModifier(new CaptureModifier(name), builder => builder.namedGroups.push(name, 0))
      );
    }
    return bindAsIncomplete(configure, this, 'captureAs');
  }

  public get ref(): RegExpToken['ref'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [number]): RegExpToken {
      if (args.length === 1 && typeof args[0] === 'number') {
        const index = args[0];
        if (index <= 0) throw new Error('Invalid group index in ref');
        return this.addNode(`\\${args[0]}`, builder => builder.backreferences.push(index));
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args, false);
        if (!captureName.test(literal))
          throw new Error('Invalid capture name. It must be alpha numeric and must not begin with a digit');
        return this.addNode(`\\k<${literal}>`, builder => builder.backreferences.push(literal));
      } else {
        throw new Error('Invalid arguments for ref');
      }
    }
    return bindAsIncomplete(func, this, 'ref');
  }

  public get group(): RegExpToken['group'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.NonCapture)));
  }

  public get ahead(): RegExpToken['ahead'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookahead)));
  }

  public get behind(): RegExpToken['behind'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookbehind)));
  }

  public get notAhead(): RegExpToken['notAhead'] {
    return this.not.ahead;
  }

  public get notBehind(): RegExpToken['notBehind'] {
    return this.not.behind;
  }

  public get oneOf(): RegExpToken['oneOf'] {
    function func(
      this: RegExpBuilder,
      ...args: RegExpLiteral | (string | RegExpToken)[]
    ): RegExpToken & AlternationFunction {
      if (!(this.modifiers[0] instanceof AlternationModifier))
        throw new Error(
          `Unexpected modifier, expected OneOfModifier, but got ${this.modifiers[0]}. This is probably a bug.`
        );
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return assign(
          func,
          this.mutateModifier(modifier => (modifier as AlternationModifier).add(literal))
        );
      } else {
        return assign(
          func,
          this.mutateModifier(
            modifier => {
              const mod = modifier as AlternationModifier;
              args.forEach(arg => {
                if (RegExpBuilder.isRegExpBuilder(arg)) {
                  mod.add(arg.executeModifiers());
                } else if (typeof arg === 'string') {
                  mod.add(arg);
                } else {
                  throw new Error('Invalid arguments for oneOf');
                }
              });
            },
            builder =>
              args.forEach(arg => {
                if (RegExpBuilder.isRegExpBuilder(arg)) {
                  builder.backreferences.push(...arg.backreferences);
                  builder.namedGroups.push(...arg.namedGroups);
                }
              })
          )
        );
      }
    }
    return bindAsIncomplete(func, this.addModifier(new AlternationModifier()), 'oneOf');
  }

  /*
   * ========== Custom ==========
   */

  public get match(): RegExpToken['match'] {
    function func(this: RegExpBuilder, ...tokens: RegExpToken[]): RegExpToken {
      if (tokens.length === 0) throw new Error('No arguments provided for match');
      if (tokens.some(token => !RegExpBuilder.isRegExpBuilder(token)))
        throw new Error('Invalid arguments for match: ' + tokens);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let builder = this;
      tokens.forEach(token => {
        builder = builder.addNode(token as RegExpBuilder);
      });
      return builder;
    }
    return bindAsIncomplete(func, this, 'match');
  }
}

/**
 * A convenient prefix for all readable RegExp expressions, which can be used to write expressions
 * without needing to import each token individually.
 *
 * @example Importing tokens individually
 * ```js
 * import { oneOrMore, exactly } from 'readable-regexp';
 *
 * const regExp = oneOrMore(exactly`fo`.maybe`o`);
 * ```
 *
 * @example Importing the `r` prefix
 * ```js
 * import { r } from 'readable-regexp';
 *
 * const regExp = r.oneOrMore(r.exactly`fo`.maybe`o`);
 * ```
 */
export const r: RegExpToken = new RegExpBuilder();

/**
 * Match any character other than newline (or including line terminators when single line flag is set).
 *
 * Note: `not.char` does not exist because it does not match anything.
 *
 * @example
 *
 * ```js
 * char
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /./
 * ```
 */
export const char = r.char;

/**
 * Match all types of whitespace characters.
 *
 * When negated: match anything other than a whitespace.
 *
 * @example
 *
 * ```js
 * whitespace
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\s/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.whitespace
 * not(whitespace)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\S/
 * ```
 */
export const whitespace = r.whitespace;

/**
 * Match a character between 0 to 9.
 *
 * @example
 *
 * ```js
 * digit
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\d/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.digit
 * not(digit)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\D/
 * ```
 */
export const digit = r.digit;

/**
 * Match alphanumeric characters and underscore.
 *
 * @example
 *
 * ```js
 * word
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\w/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.word
 * not(word)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\W/
 * ```
 */
export const word = r.word;

/**
 * Match a vertical whitespace character.
 *
 * @example
 *
 * ```js
 * verticalWhitespace
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\v/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.verticalWhitespace
 * not(verticalWhitespace)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\v]/
 * ```
 */
export const verticalWhitespace = r.verticalWhitespace;

/**
 * Match a backspace character.
 *
 * @example
 *
 * ```js
 * backspace
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[\b]/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.backspace
 * not(backspace)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\b]/
 * ```
 */
export const backspace = r.backspace;

/**
 * Match a line feed character.
 *
 * @example
 *
 * ```js
 * lineFeed
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\n/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.lineFeed
 * not(lineFeed)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\n]/
 * ```
 */
export const lineFeed = r.lineFeed;

/**
 * Match a form feed character.
 *
 * @example
 *
 * ```js
 * formFeed
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\f/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.formFeed
 * not(formFeed)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\f]/
 * ```
 */
export const formFeed = r.formFeed;

/**
 * Match a carriage return character.
 *
 * @example
 *
 * ```js
 * carriageReturn
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\r/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.carriageReturn
 * not(carriageReturn)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\r]/
 * ```
 */
export const carriageReturn = r.carriageReturn;

/**
 * Match a tab character.
 *
 * @example
 *
 * ```js
 * tab
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\t/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.tab
 * not(tab)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\t]/
 * ```
 */
export const tab = r.tab;

/**
 * Match a null character.
 *
 * @example
 *
 * ```js
 * nullChar
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\0/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.nullChar
 * not(nullChar)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\0]/
 * ```
 */
export const nullChar = r.nullChar;

/**
 * Assert position at the start of string, or start of line if multiline flag is set.
 *
 * @example
 *
 * ```js
 * lineStart
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /^/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.lineStart
 * not(lineStart)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?!^)/
 * ```
 */
export const lineStart = r.lineStart;

/**
 * Assert position at the end of string, or end of line if multiline flag is set.
 *
 * @example
 *
 * ```js
 * lineEnd
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /$/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.lineEnd
 * not(lineEnd)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?!$)/
 * ```
 */
export const lineEnd = r.lineEnd;

/**
 * Assert position at a word boundary, between `word` and non-`word` characters.
 *
 * @example
 *
 * ```js
 * wordBoundary
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\b/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * not.wordBoundary
 * not(wordBoundary)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\B/
 * ```
 */
export const wordBoundary = r.wordBoundary;

/**
 * Match the given string literally, escaping all special characters.
 *
 * @example
 *
 * ```js
 * exactly`match`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /match/
 * ```
 *
 * @example
 *
 * ```js
 * exactly`(yes/no)`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\(yes\/no\)/
 * ```
 */
export const exactly = r.exactly;

/**
 * Match a character with the given code point in base-8.
 *
 * Notes:
 *
 * The RegExp output of `octal` is always wrapped in a character class to disambiguate it from capture group
 * back-references.
 *
 * The maximum allowed value is `0o377`, which is equivalent to `0xff`.
 *
 * @example
 *
 * ```js
 * octal`123`
 * octal('123')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[\123]/
 * ```
 */
export const octal = r.octal;

/**
 * Match a character with the given code point in base-16.
 *
 * Notes:
 *
 * Both `hex` and `unicode` have the same effect, but `hex` uses the single-byte escape sequence `\xff` if possible,
 * while `unicode` always uses the 2-byte sequence `\uffff`.
 *
 * @example
 *
 * ```js
 * hex`3f`
 * hex('3f')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\x3f/
 * ```
 */
export const hex = r.hex;

/**
 * Match a character with the given code point in base-16.
 *
 * Notes:
 *
 * Both `hex` and `unicode` have the same effect, but `hex` uses the single-byte escape sequence `\xff` if possible,
 * while `unicode` always uses the 2-byte sequence `\uffff`.
 *
 * @example
 *
 * ```js
 * unicode`3ef1`
 * unicode('3ef1')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /\u3ef1/
 * ```
 */
export const unicode = r.unicode;

/**
 * Match a character listed in the group. A hyphen denotes a range of characters, such as `a-z`.
 *
 * Notes:
 *
 * `charIn` accepts a list of strings and special sequences, but you can also combine the list into one string if you
 * prefer:
 *
 *  -     charIn('a-z0-9' + whitespace)
 *  -     charIn`a-z0-9${whitespace}`
 *  -     charIn`a-z0-9\s`
 *
 * However, combining a list of options into one string is not equivalent to a simple string concatenation. `-` is
 * escaped at the beginning and end of each string in the list, so `` charIn`a-` `z` `` matches `a`, `-` and `z`
 * literally, while `` charIn`a-z` `` matches alphabets from `a` to `z`.
 *
 * Apart from `-`, `^` and `]` are also escaped in the character class, so you cannot negate a `charIn` via a `^`
 * character (you should use `notCharIn`), and you cannot close a character class prematurely.
 *
 * Backslashes `\` are only escaped at the end of a string, so you can use escape sequences such as `\uffff` and
 * `\xff` freely. If you want to include `\` in the character class, you should write it at the end of a string or
 * escape with `\\`.
 *
 * @example
 *
 * ```js
 * charIn`a-z_-`
 * charIn('a-z', '_-')
 * charIn`a-z``_-`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[a-z_-]/
 * ```
 *
 * @example Negated token
 *
 * ```js
 * notCharIn`a-z_-`
 * not.charIn`a-z_-`
 * notCharIn('a-z', '_-')
 * notCharIn`a-z``_-`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^a-z_-]/
 * ```
 */
export const charIn = r.charIn;

/**
 * Match a character not listed in the group. A hyphen denotes a range of characters, such as `a-z`.
 *
 * `notCharIn` is a short form of `not.charIn`. For details regarding character classes, see the documentation of
 * {@link charIn}.
 *
 * @example
 *
 * ```js
 * notCharIn`a-z_-`
 * not.charIn`a-z_-`
 * notCharIn('a-z', '_-')
 * notCharIn`a-z``_-`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^a-z_-]/
 * ```
 */
export const notCharIn = r.notCharIn;

export const charRange = r.charRange;

export const notCharRange = r.notCharRange;

/**
 * Negate a given token, causing it to match anything other than the token itself.
 *
 * Negatable tokens: `lineFeed`, `carriageReturn`, `backspace`, `tab`, `verticalWhitespace`, `formFeed`, `nullChar`,
 * `octal`, `hex`, `unicode`, `word`, `digit`, `whitespace`, `charIn`, `lineStart`, `lineEnd`, `wordBoundary`,
 * `ahead`, `behind`
 *
 * Examples are provided in the documentation of the negatable tokens themselves.
 *
 * @example
 *
 * ```js
 * not.lineFeed
 * not(lineFeed)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /[^\n]/
 * ```
 */
export const not = r.not;

/**
 * Match a token the specified amount of times. Supply 1 parameter for an exact number of times, or 2 parameters for
 * min/max.
 *
 * @example 2 parameters for min/max
 *
 * ```js
 * repeat(3,5)`foo`
 * repeat(3,5).exactly`foo`
 * repeat(3,5)('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){3,5}/
 * ```
 *
 * @example 1 parameter for exact number
 *
 * ```js
 * repeat(3)`foo`
 * repeat(3).exactly`foo`
 * repeat(3)('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){3}/
 * ```
 *
 * @example Lazy matching
 *
 * ```js
 * repeatLazily(3,5)`foo`
 * repeat.lazily(3,5)`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){3,5}?/
 * ```
 */
export const repeat = r.repeat;

/**
 * Match a token the specified amount of times, trying to match as short as possible. Supply 1 parameter for an exact
 * number of times, or 2 parameters for min/max.
 *
 * `repeatLazily` is a short form of `repeat.lazily`. See the documentation of {@link repeat} for more details.
 *
 * @example
 *
 * ```js
 * repeatLazily(3,5)`foo`
 * repeat.lazily(3,5)`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){3,5}?/
 * ```
 */
export const repeatLazily = r.repeatLazily;

/**
 * Match a token at least the specified amount of times.
 *
 * @example
 *
 * ```js
 * atLeast(3)`foo`
 * atLeast(3).exactly`foo`
 * atLeast(3)('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){3,}/
 * ```
 *
 * @example Lazy matching
 *
 * ```js
 * atLeastLazily(3)`foo`
 * atLeast.lazily(3)`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){3,}?/
 * ```
 */
export const atLeast = r.atLeast;

/**
 * Match a token at least the specified amount of times, trying to match as short as possible.
 *
 * `atLeastLazily` is a short form of `atLeast.lazily`. See the documentation of {@link atLeast} for more details.
 *
 * @example
 *
 * ```js
 * atLeastLazily(3)`foo`
 * atLeast.lazily(3)`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){3,}?/
 * ```
 */
export const atLeastLazily = r.atLeastLazily;

/**
 * Match a token at most the specified amount of times.
 *
 * @example
 *
 * ```js
 * atMost(3)`foo`
 * atMost(3).exactly`foo`
 * atMost(3)('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){0,3}/
 * ```
 *
 * @example Lazy matching
 *
 * ```js
 * atMostLazily(3)`foo`
 * atMost.lazily(3)`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){0,3}?/
 * ```
 */
export const atMost = r.atMost;

/**
 * Match a token at most the specified amount of times, trying to match as short as possible.
 *
 * `atMostLazily` is a short form of `atMost.lazily`. See the documentation of {@link atMost} for more details.
 *
 * @example
 *
 * ```js
 * atMostLazily(3)`foo`
 * atMost.lazily(3)`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo){0,3}?/
 * ```
 */
export const atMostLazily = r.atMostLazily;

/**
 * Match a token 0 or 1 times.
 *
 * @example
 *
 * ```js
 * maybe`foo`
 * maybe.exactly`foo`
 * maybe('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)?/
 * ```
 *
 * @example Lazy matching
 *
 * ```js
 * maybeLazily`foo`
 * maybe.lazily`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)??/
 * ```
 */
export const maybe = r.maybe;

/**
 * Match a token 0 or 1 times, trying to match as short as possible.
 *
 * `maybeLazily` is a short form of `maybe.lazily`. See the documentation of {@link maybe} for more details.
 *
 * @example
 *
 * ```js
 * maybeLazily`foo`
 * maybe.lazily`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)??/
 * ```
 */
export const maybeLazily = r.maybeLazily;

/**
 * Match a token 0 to infinite times.
 *
 * @example
 *
 * ```js
 * zeroOrMore`foo`
 * zeroOrMore.exactly`foo`
 * zeroOrMore('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)*／
 * // !! unicode ending slash to escape comment ending !!
 * ```
 *
 * @example Lazy matching
 *
 * ```js
 * zeroOrMoreLazily`foo`
 * zeroOrMore.lazily`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)*?/
 * ```
 */
export const zeroOrMore = r.zeroOrMore;

/**
 * Match a token 0 to infinite times, trying to match as short as possible.
 *
 * `zeroOrMoreLazily` is a short form of `zeroOrMore.lazily`. See the documentation of {@link zeroOrMore} for more details.
 *
 * @example
 *
 * ```js
 * zeroOrMoreLazily`foo`
 * zeroOrMore.lazily`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)*?/
 * ```
 */
export const zeroOrMoreLazily = r.zeroOrMoreLazily;

/**
 * Match a token 1 to infinite times.
 *
 * @example
 *
 * ```js
 * oneOrMore`foo`
 * oneOrMore.exactly`foo`
 * oneOrMore('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)+/
 * ```
 *
 * @example Lazy matching
 *
 * ```js
 * oneOrMoreLazily`foo`
 * oneOrMore.lazily`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)+?/
 * ```
 */
export const oneOrMore = r.oneOrMore;

/**
 * Match a token 1 to infinite times, trying to match as short as possible.
 *
 * `oneOrMoreLazily` is a short form of `oneOrMore.lazily`. See the documentation of {@link oneOrMore} for more details.
 *
 * @example
 *
 * ```js
 * oneOrMoreLazily`foo`
 * oneOrMore.lazily`foo`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)+?/
 * ```
 */
export const oneOrMoreLazily = r.oneOrMoreLazily;

/**
 * Wrap the given token in a capture group.
 *
 * @example
 *
 * ```js
 * capture`foo`
 * capture.exactly`foo`
 * capture('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(foo)/
 * ```
 */
export const capture = r.capture;

/**
 * Wrap the given token in a named capture group.
 *
 * @example
 *
 * ```js
 * captureAs`name``foo`
 * captureAs`name`.exactly`foo`
 * captureAs('name')('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?<name>foo)/
 * ```
 */
export const captureAs = r.captureAs;

/**
 * Supply a number to reference the capture group with that index. Supply a string to reference a named capture group.
 *
 * @example Named reference
 *
 * ```js
 * captureAs`name``foo`.ref`name`
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?<name>foo)\k<name>/
 * ```
 *
 * @example Number reference
 *
 * ```js
 * capture`foo`.ref(1)
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(foo)\1/
 * ```
 */
export const ref = r.ref;

/**
 * Wrap the given token in a non-capture group.
 *
 * @example
 *
 * ```js
 * group`foo`
 * group.exactly`foo`
 * group('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo)/
 * ```
 */
export const group = r.group;

/**
 * Wrap the given token in a positive lookahead.
 *
 * @example
 *
 * ```js
 * ahead`foo`
 * ahead.exactly`foo`
 * ahead('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?=foo)/
 * ```
 *
 * @example Negated token - Negative lookahead
 *
 * ```js
 * notAhead`foo`
 * not.ahead`foo`
 * notAhead.exactly`foo`
 * notAhead('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?!foo)/
 * ```
 */
export const ahead = r.ahead;

/**
 * Wrap the given token in a positive lookbehind.
 *
 * @example
 *
 * ```js
 * behind`foo`
 * behind.exactly`foo`
 * behind('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?<=foo)/
 * ```
 *
 * @example Negated token - Negative lookbehind
 *
 * ```js
 * notBehind`foo`
 * not.behind`foo`
 * notBehind.exactly`foo`
 * notBehind('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?<!foo)/
 * ```
 */
export const behind = r.behind;

/**
 * Wrap the given token in a negative lookahead.
 *
 * `notAhead` is a short form of `not.ahead`. See the documentation of {@link ahead} for more details.
 *
 * @example
 *
 * ```js
 * notAhead`foo`
 * not.ahead`foo`
 * notAhead.exactly`foo`
 * notAhead('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?!foo)/
 * ```
 */
export const notAhead = r.notAhead;

/**
 * Wrap the given token in a negative lookbehind.
 *
 * `notBehind` is a short form of `not.behind`. See the documentation of {@link behind} for more details.
 *
 * @example
 *
 * ```js
 * notBehind`foo`
 * not.behind`foo`
 * notBehind.exactly`foo`
 * notBehind('foo')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?<!foo)/
 * ```
 */
export const notBehind = r.notBehind;

/**
 * Match one in the provided list of options.
 *
 * @example
 *
 * ```js
 * oneOf`foo``bar`
 * oneOf(exactly`foo`, exactly`bar`)
 * oneOf('foo', 'bar')
 * ```
 *
 * RegExp equivalent:
 *
 * ```js
 * /(?:foo|bar)/
 * ```
 */
export const oneOf = r.oneOf;

/**
 * Include another readable RegExp token in the current expression. This is useful for extracting and re-using common
 * expressions.
 *
 * @example
 *
 * ```js
 * const number = oneOrMore.digit;
 * const coordinates = match(number).exactly`,`.match(number);
 * ```
 *
 * This is equivalent to:
 *
 * ```js
 * const coordinates = oneOrMore.digit.exactly`,`.oneOrMore.digit;
 * ```
 *
 * `match` can also accept multiple tokens and chain them together, which can be useful for code formatting.
 *
 * @example
 *
 * ```js
 * const filename = match(
 *   oneOrMore.word,
 *   exactly`_`,
 *   oneOrMore.digit,
 *   exactly`.txt`
 * );
 * ```
 *
 * This is equivalent to:
 *
 * ```js
 * const filename = oneOrMore.word.exactly`_`.oneOrMore.digit.exactly`.txt`;
 * ```
 */
export const match = r.match;

// a list of tokens with RegExpBuilder assigned to a function
const funcTokens = [
  not,
  maybe,
  maybeLazily,
  zeroOrMore,
  zeroOrMoreLazily,
  oneOrMore,
  oneOrMoreLazily,
  capture,
  group,
  ahead,
  behind,
  notAhead,
  notBehind,
];

/**
 * Checks if a token intersects either the {@link RegExpToken} or the {@link IncompleteToken} interface.
 */
type IncompleteTokenCheck<TokenType> = TokenType extends RegExpToken
  ? true
  : TokenType extends IncompleteToken
  ? true
  : false;

/**
 * Transforms template string arguments to string literals while leaving other arguments unchanged.
 */
type TransformStringLiteralArgs<Args> = Args extends [infer U, ...infer Rest]
  ? [
      U extends TemplateStringsArray ? string : U, // replace template string with ordinary string
      ...(Rest extends unknown[] ? (unknown[] extends Rest ? [] : Rest) : Rest), // Remove the rest parameter if the argument is a string literal
    ]
  : Args;

/**
 * Specifies the configurations required for a given token type.
 */
type CustomTokenConfig<TokenType> = (TokenType extends RegExpToken
  ? {
      constant: (this: RegExpToken) => RegExpToken;
    }
  : {}) &
  (TokenType extends GenericFunction<infer Args, infer ReturnType>
    ? { dynamic: (this: RegExpToken, ...args: TransformStringLiteralArgs<Args>) => ReturnType }
    : {});

function ensureTokenReturned<T extends object>(value: T): T {
  if (RegExpBuilder.isRegExpBuilder(value)) return value;
  throw new Error(
    `Invalid return value from a constant token: ${value}.\n` +
      'If you want to return any other values (which are non-chainable), ' +
      'you should implement a dynamic token without parameters to make the chain termination explicit.'
  );
}

/**
 * Define a custom token that can be used in conjunction with other tokens.
 * For a detailed guide on custom tokens, please read https://github.com/hlysine/readable-regexp#custom-tokens
 *
 * Notes:
 *
 * - TypeScript users should extend the {@link RegExpToken} interface to add their own custom tokens before calling this function.
 * - The token name must be a valid JavaScript identifier.
 * - The token name must not conflict with any existing properties of {@link RegExpToken}.
 * - All custom tokens should be defined before **any** tokens are used to build regular expressions.
 *
 * @param tokenName - The name of the custom token. In TypeScript, it needs to be defined in the {@link RegExpToken} interface.
 * @param config - The configuration for the custom token. Implement the `constant` method to return a constant token, or the `dynamic` method for a token that accepts arguments. Implement both for a mixed token.
 * @returns The custom token
 *
 * @example
 * Create a constant token
 *
 * Extend the RegExpToken interface to add a new token:
 *
 * ```ts
 * import { RegExpToken } from 'readable-regexp';
 *
 * declare module 'readable-regexp' {
 *   interface RegExpToken {
 *     severity: RegExpToken;
 *   }
 * }
 * ```
 *
 * Implement the custom token:
 *
 * ```ts
 * const severity = defineToken('severity', {
 *   constant(this: RegExpToken) {
 *     return this.oneOf`error` `warning` `info` `debug`;
 *   },
 * });
 * ```
 *
 * Use the custom token:
 *
 * ```ts
 * // Referencing the token returned by the defineToken function
 * console.log(severity.toString()); // (?:error|warning|info|debug)
 *
 * // Referencing the token in an expression
 * console.log(lineStart.severity.lineEnd.toString()); // ^(?:error|warning|info|debug)$
 * ```
 */
export function defineToken<Name extends keyof RegExpToken, Check = IncompleteTokenCheck<RegExpToken[Name]>>(
  tokenName: Name,
  config: Check extends true
    ? CustomTokenConfig<RegExpToken[Name]>
    : {
        error: 'Invalid token type: tokens should intersect the RegExpToken type if they are constant, or the IncompleteToken type if they are dynamic.';
      }
): Check extends true ? RegExpToken[Name] : never {
  if (tokenName in RegExpBuilder.prototype) throw new Error(`Token ${tokenName} already exists`);
  Object.defineProperty(RegExpBuilder.prototype, tokenName, {
    get() {
      function configure(
        this: RegExpBuilder,
        ...configArgs: RegExpToken[Name] extends (...args: infer Args) => any ? Args : never
      ): RegExpToken[Name] extends (...args: any) => infer Ret ? Ret : never {
        if ('dynamic' in config) {
          const value = isLiteralArgument(configArgs) ? [getLiteralString(configArgs)] : configArgs;
          return (config.dynamic as (this: RegExpToken, ...args: typeof value) => ReturnType<typeof configure>).apply(
            this,
            value
          );
        } else {
          throw new Error('Invalid arguments for ' + tokenName + '. This is probably a bug.');
        }
      }
      if (`constant` in config && !('dynamic' in config)) {
        return ensureTokenReturned(config.constant.apply(this));
      } else if (!(`constant` in config) && 'dynamic' in config) {
        return bindAsIncomplete(configure, this, tokenName);
      } else if (`constant` in config && 'dynamic' in config) {
        return assign(configure.bind(this), ensureTokenReturned(config.constant.apply(this)), false);
      } else {
        throw new Error(`The custom token ${tokenName} does not have any valid configurations.`);
      }
    },
    enumerable: true,
    configurable: true,
  });
  funcTokens.forEach(token => {
    if (!RegExpBuilder.isRegExpBuilder(token)) return;
    Object.defineProperty(token, tokenName, Object.getOwnPropertyDescriptor(RegExpBuilder.prototype, tokenName)!);
  });
  return r[tokenName] as ReturnType<typeof defineToken>;
}
