import {
  Flag,
  ahead,
  atLeast,
  atLeastLazily,
  atMost,
  atMostLazily,
  behind,
  capture,
  captureAs,
  char,
  charIn,
  digit,
  exactly,
  group,
  hex,
  lineStart,
  match,
  maybe,
  maybeLazily,
  not,
  notAhead,
  notBehind,
  notCharIn,
  octal,
  oneOf,
  oneOrMore,
  oneOrMoreLazily,
  r,
  ref,
  repeat,
  repeatLazily,
  unicode,
  whitespace,
  word,
  zeroOrMore,
  zeroOrMoreLazily,
} from '../src/index';

describe('toRegExp', () => {
  it('should return a RegExp', () => {
    expect(exactly`foo`.toRegExp()).toBeInstanceOf(RegExp);
    expect(exactly`foo`.toRegExp().source).toBe('foo');
  });
  it('includes flags', () => {
    expect(exactly`foo`.toRegExp().flags).toBe('');
    expect(exactly`foo`.toRegExp``.flags).toBe('');
    expect(exactly`foo`.toRegExp`i`.flags).toBe('i');
    expect(exactly`foo`.toRegExp('i').flags).toBe('i');
    expect(exactly`foo`.toRegExp(Flag.Global, Flag.Indices).flags).toBe('dg');
    expect(exactly`foo`.toRegExp`igm`.flags).toBe('gim');
    expect(exactly`foo`.toRegExp('igm').flags).toBe('gim');
    expect(exactly`foo`.toRegExp('i', 'g', 'm').flags).toBe('gim');
    expect(exactly`foo`.toRegExp('i', 'g', 'm', Flag.Sticky).flags).toBe('gimy');
  });
  it('validates flags', () => {
    // @ts-expect-error - invalid flag
    expect(() => exactly`foo`.toRegExp('k')).toThrow();
    // @ts-expect-error - invalid flag
    expect(() => exactly`foo`.toRegExp('ikg')).toThrow();
  });
});

describe('exactly', () => {
  it('accepts plain strings', () => {
    expect(exactly`foo`.toString()).toBe('foo');
    expect(exactly('foo').toString()).toBe('foo');
  });
  it('accepts template literals', () => {
    expect(exactly`foo${1}bar${2}`.toString()).toBe('foo1bar2');
  });
  it('can be quantified', () => {
    expect(oneOrMore.exactly`foo`.toString()).toBe('(?:foo)+');
    expect(oneOrMore(exactly('foo')).toString()).toBe('(?:foo)+');
  });
  it('cannot be negated', () => {
    expect(() => not.exactly`foo`.toString()).toThrow();
    expect(() => not(exactly('foo')).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => exactly(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => exactly()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => exactly('a', 'b')).toThrow();
    // @ts-expect-error - testing missing arguments
    expect(() => exactly.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => exactly.exactly`a`.toString()).toThrow();
  });
});

describe('octal', () => {
  it('accepts literals', () => {
    expect(octal`123`.toString()).toBe('[\\123]');
    expect(octal('123').toString()).toBe('[\\123]');
  });
  it('accepts template literals', () => {
    expect(octal`${1}2${3}`.toString()).toBe('[\\123]');
  });
  it('validates correctly', () => {
    expect(octal`377`.toString()).toBe('[\\377]');
    expect(octal`100`.toString()).toBe('[\\100]');
    expect(octal`1`.toString()).toBe('[\\1]');
    expect(octal`64`.toString()).toBe('[\\64]');
    expect(() => octal``).toThrow();
    expect(() => octal`abc`).toThrow();
    expect(() => octal`386`).toThrow();
    expect(() => octal`400`).toThrow();
  });
  it('can be negated and quantified', () => {
    expect(not.octal`123`.toString()).toBe('[^\\123]');
    expect(oneOrMore.octal`123`.toString()).toBe('[\\123]+');
    expect(oneOrMore.not.octal`123`.toString()).toBe('[^\\123]+');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(octal(1).toString()).toBe('[\\1]');
    // @ts-expect-error - testing invalid arguments
    expect(() => octal()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => octal('a', 'b')).toThrow();
    // @ts-expect-error - testing missing arguments
    expect(() => octal.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => octal.octal`123`.toString()).toThrow();
  });
});

describe('hex', () => {
  it('accepts literals', () => {
    expect(hex`2e`.toString()).toBe('\\x2e');
    expect(hex('2e').toString()).toBe('\\x2e');
    expect(hex`12ef`.toString()).toBe('\\u12ef');
    expect(hex('12ef').toString()).toBe('\\u12ef');
  });
  it('accepts template literals', () => {
    expect(hex`f${2}`.toString()).toBe('\\xf2');
    expect(hex`e${1}f${2}`.toString()).toBe('\\ue1f2');
  });
  it('validates correctly', () => {
    expect(hex`1`.toString()).toBe('\\x01');
    expect(hex`12ef`.toString()).toBe('\\u12ef');
    expect(hex`FFFF`.toString()).toBe('\\uffff');
    expect(hex`aBcD`.toString()).toBe('\\uabcd');
    expect(hex`123`.toString()).toBe('\\u0123');
    expect(() => hex``).toThrow();
    expect(() => hex`g1h2`).toThrow();
    expect(() => hex`123ef`).toThrow();
  });
  it('can be negated and quantified', () => {
    expect(not.hex`2e`.toString()).toBe('[^\\x2e]');
    expect(oneOrMore.hex`2e`.toString()).toBe('\\x2e+');
    expect(oneOrMore.not.hex`2e`.toString()).toBe('[^\\x2e]+');
    expect(not.hex`12ef`.toString()).toBe('[^\\u12ef]');
    expect(oneOrMore.hex`12ef`.toString()).toBe('\\u12ef+');
    expect(oneOrMore.not.hex`12ef`.toString()).toBe('[^\\u12ef]+');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(hex(1).toString()).toBe('\\x01');
    // @ts-expect-error - testing invalid arguments
    expect(() => hex()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => hex('a', 'b')).toThrow();
    // @ts-expect-error - testing missing arguments
    expect(() => hex.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => hex.hex`2e`.toString()).toThrow();
  });
});

describe('unicode', () => {
  it('accepts literals', () => {
    expect(unicode`12ef`.toString()).toBe('\\u12ef');
    expect(unicode('12ef').toString()).toBe('\\u12ef');
  });
  it('accepts template literals', () => {
    expect(unicode`e${1}f${2}`.toString()).toBe('\\ue1f2');
  });
  it('validates correctly', () => {
    expect(unicode`12ef`.toString()).toBe('\\u12ef');
    expect(unicode`FFFF`.toString()).toBe('\\uffff');
    expect(unicode`aBcD`.toString()).toBe('\\uabcd');
    expect(unicode`123`.toString()).toBe('\\u0123');
    expect(() => unicode``).toThrow();
    expect(() => unicode`g1h2`).toThrow();
    expect(() => unicode`123ef`).toThrow();
  });
  it('can be negated and quantified', () => {
    expect(not.unicode`12ef`.toString()).toBe('[^\\u12ef]');
    expect(oneOrMore.unicode`12ef`.toString()).toBe('\\u12ef+');
    expect(oneOrMore.not.unicode`12ef`.toString()).toBe('[^\\u12ef]+');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(unicode(1).toString()).toBe('\\u0001');
    // @ts-expect-error - testing invalid arguments
    expect(() => unicode()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => unicode('a', 'b')).toThrow();
    // @ts-expect-error - testing missing arguments
    expect(() => unicode.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => unicode.unicode`12ef`.toString()).toThrow();
  });
});

describe('not', () => {
  it('is chainable', () => {
    expect(not.whitespace.exactly`foo`.toString()).toBe('\\Sfoo');
    expect(exactly`foo`.not.whitespace.toString()).toBe('foo\\S');
    expect(not.whitespace.not(whitespace).not.whitespace.toString()).toBe('\\S\\S\\S');
  });
  it('does not allow non-negatable tokens', () => {
    expect(() => not(char)).toThrow();
  });
  it('can be quantified', () => {
    expect(oneOrMore.not.word.toString()).toBe('\\W+');
    expect(oneOrMore(not(word)).toString()).toBe('\\W+');
  });
  it('cannot be negated', () => {
    expect(() => not.not.word.toString()).toThrow();
    expect(() => not(not(word)).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => not('abc')).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => not(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => not()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => not('a', 'b')).toThrow();
  });
});

describe('repeat', () => {
  it('accepts plain strings', () => {
    expect(repeat(3)`foo`.toString()).toBe('(?:foo){3}');
    expect(repeat(3)('foo').toString()).toBe('(?:foo){3}');
    expect(repeat(3, 5)`foo`.toString()).toBe('(?:foo){3,5}');
    expect(repeat(3, 5)('foo').toString()).toBe('(?:foo){3,5}');
  });
  it('accepts special tokens', () => {
    expect(repeat(3)(char).toString()).toBe('.{3}');
    expect(repeat(3).char.toString()).toBe('.{3}');
    expect(repeat(3, 5)(char).toString()).toBe('.{3,5}');
    expect(repeat(3, 5).char.toString()).toBe('.{3,5}');
  });
  it('accepts expressions', () => {
    expect(repeat(3)(exactly`foo`).toString()).toBe('(?:foo){3}');
    expect(repeat(3).exactly`foo`.toString()).toBe('(?:foo){3}');
    expect(repeat(3, 5)(exactly`foo`).toString()).toBe('(?:foo){3,5}');
    expect(repeat(3, 5).exactly`foo`.toString()).toBe('(?:foo){3,5}');
  });
  it('validates quantifier range', () => {
    expect(() => repeat(5, 3)`foo`.toString()).toThrow();
    expect(repeat(3, 3)`foo`.toString()).toBe('(?:foo){3}');
  });
  it('cannot be quantified in dot syntax', () => {
    expect(oneOrMore.repeat(3, 5)`foo`.toString()).toBe('(?:(?:foo){3,5})+');
    expect(oneOrMore(repeat(3, 5)`foo`).toString()).toBe('(?:(?:foo){3,5})+');
  });
  it('cannot be negated', () => {
    expect(() => not.repeat(3, 5)`foo`.toString()).toThrow();
    expect(() => not(repeat(3, 5)`foo`).toString()).toThrow();
  });
  it('supports lazily', () => {
    expect(repeat(3, 5).lazily`foo`.toString()).toBe('(?:foo){3,5}?');
    expect(
      repeat(3, 5)
        .lazily(exactly`foo`)
        .toString()
    ).toBe('(?:foo){3,5}?');
    expect(repeatLazily(3, 5)`foo`.toString()).toBe('(?:foo){3,5}?');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat('1')).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat('a', 'b')).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat(undefined, undefined)`foo`.toString()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat(null, null)`foo`.toString()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat(3, 5)()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat(3, 5)(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => repeat(3, 5)('a', 'b')).toThrow();
    // @ts-expect-error - testing missing arguments
    expect(() => repeat.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => repeatLazily.toString()).toThrow('required parameters');
    expect(() => repeat(3, 5).lazily.toString()).toThrow('nothing to quantify');
    expect(() => repeat(3, 5).toString()).toThrow('nothing to quantify');
    // @ts-expect-error - testing missing arguments
    expect(() => repeat.repeat(3, 5).toString()).toThrow();
  });
});

describe('atLeast', () => {
  it('accepts plain strings', () => {
    expect(atLeast(3)`foo`.toString()).toBe('(?:foo){3,}');
    expect(atLeast(3)('foo').toString()).toBe('(?:foo){3,}');
  });
  it('accepts special tokens', () => {
    expect(atLeast(3)(char).toString()).toBe('.{3,}');
    expect(atLeast(3).char.toString()).toBe('.{3,}');
  });
  it('accepts expressions', () => {
    expect(atLeast(3)(exactly`foo`).toString()).toBe('(?:foo){3,}');
    expect(atLeast(3).exactly`foo`.toString()).toBe('(?:foo){3,}');
  });
  it('cannot be quantified in dot syntax', () => {
    expect(oneOrMore.atLeast(3)`foo`.toString()).toBe('(?:(?:foo){3,})+');
    expect(oneOrMore(atLeast(3)`foo`).toString()).toBe('(?:(?:foo){3,})+');
  });
  it('cannot be negated', () => {
    expect(() => not.atLeast(3)`foo`.toString()).toThrow();
    expect(() => not(atLeast(3)`foo`).toString()).toThrow();
  });
  it('supports lazily', () => {
    expect(atLeast(3).lazily`foo`.toString()).toBe('(?:foo){3,}?');
    expect(
      atLeast(3)
        .lazily(exactly`foo`)
        .toString()
    ).toBe('(?:foo){3,}?');
    expect(atLeastLazily(3)`foo`.toString()).toBe('(?:foo){3,}?');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => atLeast()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atLeast('1')).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atLeast('a', 'b')).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atLeast(3)()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atLeast(3)(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atLeast(3)('a', 'b')).toThrow();
    // @ts-expect-error - testing missing arguments
    expect(() => atLeast.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => atLeastLazily.toString()).toThrow('required parameters');
    expect(() => atLeast(3).lazily.toString()).toThrow('nothing to quantify');
    expect(() => atLeast(3).toString()).toThrow('nothing to quantify');
    // @ts-expect-error - testing missing arguments
    expect(() => atLeast.atLeast(3).toString()).toThrow();
  });
});

describe('atMost', () => {
  it('accepts plain strings', () => {
    expect(atMost(3)`foo`.toString()).toBe('(?:foo){0,3}');
    expect(atMost(3)('foo').toString()).toBe('(?:foo){0,3}');
  });
  it('accepts special tokens', () => {
    expect(atMost(3)(char).toString()).toBe('.{0,3}');
    expect(atMost(3).char.toString()).toBe('.{0,3}');
  });
  it('accepts expressions', () => {
    expect(atMost(3)(exactly`foo`).toString()).toBe('(?:foo){0,3}');
    expect(atMost(3).exactly`foo`.toString()).toBe('(?:foo){0,3}');
  });
  it('cannot be quantified in dot syntax', () => {
    expect(oneOrMore.atMost(3)`foo`.toString()).toBe('(?:(?:foo){0,3})+');
    expect(oneOrMore(atMost(3)`foo`).toString()).toBe('(?:(?:foo){0,3})+');
  });
  it('cannot be negated', () => {
    expect(() => not.atMost(3)`foo`.toString()).toThrow();
    expect(() => not(atMost(3)`foo`).toString()).toThrow();
  });
  it('supports lazily', () => {
    expect(atMost(3).lazily`foo`.toString()).toBe('(?:foo){0,3}?');
    expect(
      atMost(3)
        .lazily(exactly`foo`)
        .toString()
    ).toBe('(?:foo){0,3}?');
    expect(atMostLazily(3)`foo`.toString()).toBe('(?:foo){0,3}?');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => atMost()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atMost('1')).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atMost('a', 'b')).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atMost(3)()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atMost(3)(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => atMost(3)('a', 'b')).toThrow();
    // @ts-expect-error - testing missing arguments
    expect(() => atMost.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => atMostLazily.toString()).toThrow('required parameters');
    expect(() => atMost(3).lazily.toString()).toThrow('nothing to quantify');
    expect(() => atMost(3).toString()).toThrow('nothing to quantify');
    // @ts-expect-error - testing missing arguments
    expect(() => atMost.atMost(3).toString()).toThrow();
  });
});

describe('maybe', () => {
  it('accepts plain strings', () => {
    expect(maybe`foo`.toString()).toBe('(?:foo)?');
    expect(maybe('foo').toString()).toBe('(?:foo)?');
  });
  it('accepts special tokens', () => {
    expect(maybe(char).toString()).toBe('.?');
    expect(maybe.char.toString()).toBe('.?');
  });
  it('accepts expressions', () => {
    expect(maybe(exactly`foo`).toString()).toBe('(?:foo)?');
    expect(maybe.exactly`foo`.toString()).toBe('(?:foo)?');
  });
  it('is chainable', () => {
    expect(exactly`foo`.maybe.exactly`foo`.toString()).toBe('foo(?:foo)?');
    expect(exactly('foo').maybe(exactly('foo')).toString()).toBe('foo(?:foo)?');
  });
  it('cannot be quantified in dot syntax', () => {
    expect(oneOrMore.maybe`foo`.toString()).toBe('(?:(?:foo)?)+');
    expect(oneOrMore(maybe`foo`).toString()).toBe('(?:(?:foo)?)+');
  });
  it('cannot be negated', () => {
    expect(() => not.maybe`foo`.toString()).toThrow();
    expect(() => not(maybe`foo`).toString()).toThrow();
  });
  it('supports lazily', () => {
    expect(maybe.lazily`foo`.toString()).toBe('(?:foo)??');
    expect(maybe.lazily(exactly`foo`).toString()).toBe('(?:foo)??');
    expect(maybeLazily`foo`.toString()).toBe('(?:foo)??');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => maybe()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => maybe(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => maybe('a', 'b')).toThrow();
  });
});

describe('zeroOrMore', () => {
  it('accepts plain strings', () => {
    expect(zeroOrMore`foo`.toString()).toBe('(?:foo)*');
    expect(zeroOrMore('foo').toString()).toBe('(?:foo)*');
  });
  it('accepts special tokens', () => {
    expect(zeroOrMore(char).toString()).toBe('.*');
    expect(zeroOrMore.char.toString()).toBe('.*');
  });
  it('accepts expressions', () => {
    expect(zeroOrMore(exactly`foo`).toString()).toBe('(?:foo)*');
    expect(zeroOrMore.exactly`foo`.toString()).toBe('(?:foo)*');
  });
  it('is chainable', () => {
    expect(exactly`foo`.zeroOrMore.exactly`foo`.toString()).toBe('foo(?:foo)*');
    expect(exactly('foo').zeroOrMore(exactly('foo')).toString()).toBe('foo(?:foo)*');
  });
  it('cannot be quantified in dot syntax', () => {
    expect(oneOrMore.zeroOrMore`foo`.toString()).toBe('(?:(?:foo)*)+');
    expect(oneOrMore(zeroOrMore`foo`).toString()).toBe('(?:(?:foo)*)+');
  });
  it('cannot be negated', () => {
    expect(() => not.zeroOrMore`foo`.toString()).toThrow();
    expect(() => not(zeroOrMore`foo`).toString()).toThrow();
  });
  it('supports lazily', () => {
    expect(zeroOrMore.lazily`foo`.toString()).toBe('(?:foo)*?');
    expect(zeroOrMore.lazily(exactly`foo`).toString()).toBe('(?:foo)*?');
    expect(zeroOrMoreLazily`foo`.toString()).toBe('(?:foo)*?');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => zeroOrMore()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => zeroOrMore(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => zeroOrMore('a', 'b')).toThrow();
  });
});

describe('oneOrMore', () => {
  it('accepts plain strings', () => {
    expect(oneOrMore`foo`.toString()).toBe('(?:foo)+');
    expect(oneOrMore('foo').toString()).toBe('(?:foo)+');
  });
  it('accepts special tokens', () => {
    expect(oneOrMore(char).toString()).toBe('.+');
    expect(oneOrMore.char.toString()).toBe('.+');
  });
  it('accepts expressions', () => {
    expect(oneOrMore(exactly`foo`).toString()).toBe('(?:foo)+');
    expect(oneOrMore.exactly`foo`.toString()).toBe('(?:foo)+');
  });
  it('is chainable', () => {
    expect(exactly`foo`.oneOrMore.exactly`foo`.toString()).toBe('foo(?:foo)+');
    expect(exactly('foo').oneOrMore(exactly('foo')).toString()).toBe('foo(?:foo)+');
  });
  it('cannot be quantified in dot syntax', () => {
    expect(oneOrMore.oneOrMore`foo`.toString()).toBe('(?:(?:foo)+)+');
    expect(oneOrMore(oneOrMore`foo`).toString()).toBe('(?:(?:foo)+)+');
  });
  it('cannot be negated', () => {
    expect(() => not.oneOrMore`foo`.toString()).toThrow();
    expect(() => not(oneOrMore`foo`).toString()).toThrow();
  });
  it('supports lazily', () => {
    expect(oneOrMore.lazily`foo`.toString()).toBe('(?:foo)+?');
    expect(oneOrMore.lazily(exactly`foo`).toString()).toBe('(?:foo)+?');
    expect(oneOrMoreLazily`foo`.toString()).toBe('(?:foo)+?');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOrMore()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOrMore(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOrMore('a', 'b')).toThrow();
  });
});

describe('lazily', () => {
  it('cannot be used alone', () => {
    expect(maybe.lazily`bar`.toString()).toBe('(?:bar)??');
    expect(() => exactly`foo`.lazily`bar`).toThrow();
  });
  it('cannot be repeated', () => {
    expect(repeatLazily(3, 5).lazily`foo`.toString()).toBe('(?:foo){3,5}?');
    expect(repeat(3, 5).lazily.lazily`foo`.toString()).toBe('(?:foo){3,5}?');
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOrMore.lazily()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOrMore.lazily(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOrMore.lazily('a', 'b')).toThrow();
  });
});

describe('capture', () => {
  it('accepts plain strings', () => {
    expect(capture`foo`.toString()).toBe('(foo)');
    expect(capture('foo').toString()).toBe('(foo)');
  });
  it('accepts special tokens', () => {
    expect(capture(char).toString()).toBe('(.)');
    expect(capture.char.toString()).toBe('(.)');
  });
  it('accepts expressions', () => {
    expect(capture(exactly`foo`).toString()).toBe('(foo)');
    expect(capture.exactly`foo`.toString()).toBe('(foo)');
  });
  it('is chainable', () => {
    expect(exactly`foo`.capture.exactly`foo`.toString()).toBe('foo(foo)');
    expect(exactly('foo').capture(exactly('foo')).toString()).toBe('foo(foo)');
  });
  it('can be quantified', () => {
    expect(oneOrMore.capture`foo`.toString()).toBe('(foo)+');
    expect(oneOrMore(capture`foo`).toString()).toBe('(foo)+');
  });
  it('cannot be negated', () => {
    expect(() => not.capture`foo`.toString()).toThrow();
    expect(() => not(capture`foo`).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    expect(() => capture().toString()).toThrow('Empty capture group');
    // @ts-expect-error - testing invalid arguments
    expect(() => capture(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => capture('a', 'b')).toThrow();
  });
});

describe('captureAs', () => {
  it('accepts plain strings', () => {
    expect(captureAs`bar``foo`.toString()).toBe('(?<bar>foo)');
    expect(captureAs`bar`('foo').toString()).toBe('(?<bar>foo)');
    expect(captureAs('bar')`foo`.toString()).toBe('(?<bar>foo)');
    expect(captureAs('bar')('foo').toString()).toBe('(?<bar>foo)');
  });
  it('accepts special tokens', () => {
    expect(captureAs`bar`(char).toString()).toBe('(?<bar>.)');
    expect(captureAs`bar`.char.toString()).toBe('(?<bar>.)');
    expect(captureAs('bar')(char).toString()).toBe('(?<bar>.)');
    expect(captureAs('bar').char.toString()).toBe('(?<bar>.)');
  });
  it('accepts expressions', () => {
    expect(captureAs`bar`(exactly`foo`).toString()).toBe('(?<bar>foo)');
    expect(captureAs`bar`.exactly`foo`.toString()).toBe('(?<bar>foo)');
    expect(captureAs('bar')(exactly`foo`).toString()).toBe('(?<bar>foo)');
    expect(captureAs('bar').exactly`foo`.toString()).toBe('(?<bar>foo)');
  });
  it('is chainable', () => {
    expect(exactly`foo`.captureAs`bar`.exactly`foo`.toString()).toBe('foo(?<bar>foo)');
    expect(exactly('foo').captureAs`bar`(exactly('foo')).toString()).toBe('foo(?<bar>foo)');
  });
  it('validates correctly', () => {
    expect(captureAs`bar``foo`.toString()).toBe('(?<bar>foo)');
    expect(captureAs`Bar_123``foo`.toString()).toBe('(?<Bar_123>foo)');
    expect(captureAs`_bAR123``foo`.toString()).toBe('(?<_bAR123>foo)');
    expect(() => captureAs`123bar``foo`.toString()).toThrow();
    expect(() => captureAs```foo`.toString()).toThrow();
    expect(() => captureAs`bar``foo`.captureAs`bar``foo`.toString()).toThrow();
    expect(() => captureAs`bar`(captureAs`bar``foo`).toString()).toThrow();
  });
  it('can be quantified', () => {
    expect(oneOrMore.captureAs`bar``foo`.toString()).toBe('(?<bar>foo)+');
    expect(oneOrMore(captureAs`bar``foo`).toString()).toBe('(?<bar>foo)+');
  });
  it('cannot be negated', () => {
    expect(() => not.captureAs`bar``foo`.toString()).toThrow();
    expect(() => not(captureAs`bar``foo`).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => captureAs()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => captureAs(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => captureAs('a', 'b')).toThrow();

    expect(() => captureAs`foo`().toString()).toThrow('Empty capture group');
    // @ts-expect-error - testing invalid arguments
    expect(() => captureAs`foo`(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => captureAs`foo`('a', 'b')).toThrow();

    // @ts-expect-error - testing missing arguments
    expect(() => captureAs.toString()).toThrow('required parameters');
    expect(() => captureAs`test`.toString()).toThrow('Empty capture group');
    // @ts-expect-error - testing missing arguments
    expect(() => captureAs.captureAs(3).toString()).toThrow();
  });
});

describe('ref', () => {
  it('accepts literals', () => {
    expect(ref`bar`).toHaveProperty('regExp', '\\k<bar>');
    expect(ref('bar')).toHaveProperty('regExp', '\\k<bar>');
  });
  it('accepts numbers', () => {
    expect(ref(1)).toHaveProperty('regExp', '\\1');
  });
  it('accepts template literals', () => {
    expect(ref`e${1}f${2}`.captureAs`e${1}f${2}``foo`.toString()).toBe('\\k<e1f2>(?<e1f2>foo)');
  });
  it('validates correctly', () => {
    expect(ref`Foo`).toHaveProperty('regExp', '\\k<Foo>');
    expect(ref`foo_123`).toHaveProperty('regExp', '\\k<foo_123>');
    expect(ref`_foo123_`).toHaveProperty('regExp', '\\k<_foo123_>');
    expect(ref(10)).toHaveProperty('regExp', '\\10');
    expect(() => ref``).toThrow();
    expect(() => ref`123`).toThrow();
    expect(() => ref`123ef`).toThrow();
    expect(() => ref(-1)).toThrow();
    expect(() => ref(0)).toThrow();
  });
  it('validates references', () => {
    expect(ref`bar`.captureAs`bar``foo`.toString()).toBe('\\k<bar>(?<bar>foo)');
    expect(ref(2).capture`foo`.capture`foo2`.toString()).toBe('\\2(foo)(foo2)');
    expect(ref(2).captureAs`bar``foo`.captureAs`bar2``foo2`.toString()).toBe('\\2(?<bar>foo)(?<bar2>foo2)');
    expect(
      ref(2)
        .match(captureAs`bar``foo`.captureAs`bar2``foo2`)
        .toString()
    ).toBe('\\2(?<bar>foo)(?<bar2>foo2)');
    expect(
      ref(2)
        .oneOf(captureAs`bar``foo`, captureAs`bar2``foo2`)
        .toString()
    ).toBe('\\2(?:(?<bar>foo)|(?<bar2>foo2))');
    expect(
      ref(2)
        .ahead(captureAs`bar``foo`.captureAs`bar2``foo2`)
        .toString()
    ).toBe('\\2(?=(?<bar>foo)(?<bar2>foo2))');
    expect(captureAs`bar``foo`.ahead(ref(1)).toString()).toBe('(?<bar>foo)(?=\\1)');
    expect(() => ref`baz`.toString()).toThrow();
    expect(() => ref`baz`.captureAs`bar``foo`.toString()).toThrow();
    expect(() => ref`bar`.ref`baz`.captureAs`bar``foo`.toString()).toThrow();
    expect(() => ref(2).captureAs`bar``foo`.toString()).toThrow();
    expect(() => ref(2).capture`foo`.toString()).toThrow();
    expect(() =>
      ref(3)
        .match(captureAs`bar``foo`.captureAs`bar2``foo2`)
        .toString()
    ).toThrow();
    expect(() =>
      ref(3)
        .oneOf(captureAs`bar``foo`, captureAs`bar2``foo2`)
        .toString()
    ).toThrow();
    expect(() =>
      ref(3)
        .ahead(captureAs`bar``foo`.captureAs`bar2``foo2`)
        .toString()
    ).toThrow();
    expect(() => captureAs`bar``foo`.ahead(ref(2)).toString()).toThrow();
  });
  it('can be quantified', () => {
    expect(oneOrMore.ref`bar`).toHaveProperty('regExp', '(?:\\k<bar>)+');
    expect(oneOrMore(ref`bar`)).toHaveProperty('regExp', '(?:\\k<bar>)+');
    expect(oneOrMore.ref(1)).toHaveProperty('regExp', '\\1+');
    expect(oneOrMore(ref(12))).toHaveProperty('regExp', '\\12+');
  });
  it('cannot be negated', () => {
    expect(() => not.ref`foo`).toThrow();
    expect(() => not(ref`foo`)).toThrow();
  });
  it('throws for invalid argument', () => {
    // @ts-expect-error - testing invalid arguments
    expect(() => ref()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => ref('a', 'b')).toThrow();

    // @ts-expect-error - testing missing arguments
    expect(() => ref.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => ref.ref(3).toString()).toThrow();
  });
});

describe('group', () => {
  it('accepts plain strings', () => {
    expect(group`foo`.toString()).toBe('(?:foo)');
    expect(group('foo').toString()).toBe('(?:foo)');
  });
  it('accepts special tokens', () => {
    expect(group(char).toString()).toBe('(?:.)');
    expect(group.char.toString()).toBe('(?:.)');
  });
  it('accepts expressions', () => {
    expect(group(exactly`foo`).toString()).toBe('(?:foo)');
    expect(group.exactly`foo`.toString()).toBe('(?:foo)');
  });
  it('is chainable', () => {
    expect(exactly`foo`.group.exactly`foo`.toString()).toBe('foo(?:foo)');
    expect(exactly('foo').group(exactly('foo')).toString()).toBe('foo(?:foo)');
  });
  it('can be quantified', () => {
    expect(oneOrMore.group`foo`.toString()).toBe('(?:foo)+');
    expect(oneOrMore(group`foo`).toString()).toBe('(?:foo)+');
  });
  it('cannot be negated', () => {
    expect(() => not.group`foo`.toString()).toThrow();
    expect(() => not(group`foo`).toString()).toThrow();
  });
  it('does not wrap multiple times', () => {
    expect(group.group.exactly`foo`.toString()).toBe('(?:foo)');
    expect(group.oneOf`foo``bar`.toString()).toBe('(?:foo|bar)');
  });
  it('throws for invalid argument', () => {
    expect(group().toString()).toBe('(?:)');
    // @ts-expect-error - testing invalid arguments
    expect(() => group(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => group('a', 'b')).toThrow();
  });
});

describe('ahead', () => {
  it('accepts plain strings', () => {
    expect(ahead`foo`.toString()).toBe('(?=foo)');
    expect(ahead('foo').toString()).toBe('(?=foo)');
  });
  it('accepts special tokens', () => {
    expect(ahead(char).toString()).toBe('(?=.)');
    expect(ahead.char.toString()).toBe('(?=.)');
  });
  it('accepts expressions', () => {
    expect(ahead(exactly`foo`).toString()).toBe('(?=foo)');
    expect(ahead.exactly`foo`.toString()).toBe('(?=foo)');
  });
  it('is chainable', () => {
    expect(exactly`foo`.ahead.exactly`foo`.toString()).toBe('foo(?=foo)');
    expect(exactly('foo').ahead(exactly('foo')).toString()).toBe('foo(?=foo)');
  });
  it('can be quantified', () => {
    expect(oneOrMore.ahead`foo`.toString()).toBe('(?:(?=foo))+');
    expect(oneOrMore(ahead`foo`).toString()).toBe('(?:(?=foo))+');
  });
  it('can be negated', () => {
    expect(not.ahead`foo`.toString()).toBe('(?!foo)');
    expect(not(ahead`foo`).toString()).toBe('(?!foo)');
  });
  it('throws for invalid argument', () => {
    expect(ahead().toString()).toBe('(?=)');
    // @ts-expect-error - testing invalid arguments
    expect(() => ahead(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => ahead('a', 'b')).toThrow();
  });
});

describe('behind', () => {
  it('accepts plain strings', () => {
    expect(behind`foo`.toString()).toBe('(?<=foo)');
    expect(behind('foo').toString()).toBe('(?<=foo)');
  });
  it('accepts special tokens', () => {
    expect(behind(char).toString()).toBe('(?<=.)');
    expect(behind.char.toString()).toBe('(?<=.)');
  });
  it('accepts expressions', () => {
    expect(behind(exactly`foo`).toString()).toBe('(?<=foo)');
    expect(behind.exactly`foo`.toString()).toBe('(?<=foo)');
  });
  it('is chainable', () => {
    expect(exactly`foo`.behind.exactly`foo`.toString()).toBe('foo(?<=foo)');
    expect(exactly('foo').behind(exactly('foo')).toString()).toBe('foo(?<=foo)');
  });
  it('can be quantified', () => {
    expect(oneOrMore.behind`foo`.toString()).toBe('(?:(?<=foo))+');
    expect(oneOrMore(behind`foo`).toString()).toBe('(?:(?<=foo))+');
  });
  it('can be negated', () => {
    expect(not.behind`foo`.toString()).toBe('(?<!foo)');
    expect(not(behind`foo`).toString()).toBe('(?<!foo)');
  });
  it('throws for invalid argument', () => {
    expect(behind().toString()).toBe('(?<=)');
    // @ts-expect-error - testing invalid arguments
    expect(() => behind(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => behind('a', 'b')).toThrow();
  });
});

describe('notAhead', () => {
  it('accepts plain strings', () => {
    expect(notAhead`foo`.toString()).toBe('(?!foo)');
    expect(notAhead('foo').toString()).toBe('(?!foo)');
  });
  it('accepts special tokens', () => {
    expect(notAhead(char).toString()).toBe('(?!.)');
    expect(notAhead.char.toString()).toBe('(?!.)');
  });
  it('accepts expressions', () => {
    expect(notAhead(exactly`foo`).toString()).toBe('(?!foo)');
    expect(notAhead.exactly`foo`.toString()).toBe('(?!foo)');
  });
  it('is chainable', () => {
    expect(exactly`foo`.notAhead.exactly`foo`.toString()).toBe('foo(?!foo)');
    expect(exactly('foo').notAhead(exactly('foo')).toString()).toBe('foo(?!foo)');
  });
  it('can be quantified', () => {
    expect(oneOrMore.notAhead`foo`.toString()).toBe('(?:(?!foo))+');
    expect(oneOrMore(notAhead`foo`).toString()).toBe('(?:(?!foo))+');
  });
  it('cannot be negated', () => {
    expect(() => not.notAhead`foo`.toString()).toThrow();
    expect(() => not(notAhead`foo`).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    expect(notAhead().toString()).toBe('(?!)');
    // @ts-expect-error - testing invalid arguments
    expect(() => notAhead(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => notAhead('a', 'b')).toThrow();
  });
});

describe('notBehind', () => {
  it('accepts plain strings', () => {
    expect(notBehind`foo`.toString()).toBe('(?<!foo)');
    expect(notBehind('foo').toString()).toBe('(?<!foo)');
  });
  it('accepts special tokens', () => {
    expect(notBehind(char).toString()).toBe('(?<!.)');
    expect(notBehind.char.toString()).toBe('(?<!.)');
  });
  it('accepts expressions', () => {
    expect(notBehind(exactly`foo`).toString()).toBe('(?<!foo)');
    expect(notBehind.exactly`foo`.toString()).toBe('(?<!foo)');
  });
  it('is chainable', () => {
    expect(exactly`foo`.notBehind.exactly`foo`.toString()).toBe('foo(?<!foo)');
    expect(exactly('foo').notBehind(exactly('foo')).toString()).toBe('foo(?<!foo)');
  });
  it('can be quantified', () => {
    expect(oneOrMore.notBehind`foo`.toString()).toBe('(?:(?<!foo))+');
    expect(oneOrMore(notBehind`foo`).toString()).toBe('(?:(?<!foo))+');
  });
  it('cannot be negated', () => {
    expect(() => not.notBehind`foo`.toString()).toThrow();
    expect(() => not(notBehind`foo`).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    expect(notBehind().toString()).toBe('(?<!)');
    // @ts-expect-error - testing invalid arguments
    expect(() => notBehind(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => notBehind('a', 'b')).toThrow();
  });
});

describe('oneOf', () => {
  it('accepts plain strings', () => {
    expect(oneOf`foo`.toString()).toBe('(?:foo)');
    expect(oneOf('foo').toString()).toBe('(?:foo)');
  });
  it('works with multiple values', () => {
    expect(oneOf`foo``bar``baz`.toString()).toBe('(?:foo|bar|baz)');
    expect(oneOf('foo', 'bar', exactly`baz`).toString()).toBe('(?:foo|bar|baz)');
    expect(oneOf('foo')('bar')(exactly`baz`).toString()).toBe('(?:foo|bar|baz)');
  });
  it('is chainable', () => {
    expect(oneOf`foo``bar``baz`.char.toString()).toBe('(?:foo|bar|baz).');
    expect(oneOrMore.oneOf`foo``bar`(exactly`baz`.char).toString()).toBe('(?:foo|bar|baz.)+');
  });
  it('can be quantified', () => {
    expect(oneOrMore.oneOf`foo``bar``baz`.toString()).toBe('(?:foo|bar|baz)+');
    expect(oneOrMore(oneOf`foo``bar``baz`).toString()).toBe('(?:foo|bar|baz)+');
  });
  it('cannot be negated', () => {
    expect(() => not.oneOf`foo``bar``baz`.toString()).toThrow();
    expect(() => not(oneOf`foo``bar``baz`).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    expect(() => oneOf().toString()).toThrow();
    expect(oneOf``.toString()).toBe('(?:)');
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOf(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => oneOf('a', 1, 12)).toThrow();

    // @ts-expect-error - testing missing arguments
    expect(() => oneOf.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => oneOf.oneOf(3).toString()).toThrow();
  });
});

describe('match', () => {
  it('accepts expressions', () => {
    expect(match(exactly`foo`).toString()).toBe('foo');
    expect(match(exactly`foo`, exactly`bar`).toString()).toBe('foobar');
    expect(match(not.behind`foo`, maybe.exactly`bar`, oneOrMore`baz`).toString()).toBe('(?<!foo)(?:bar)?(?:baz)+');
  });
  it('is chainable', () => {
    expect(match(exactly`foo`).char.toString()).toBe('foo.');
    expect(oneOrMore.match(exactly`baz`.char).toString()).toBe('(?:baz.)+');
  });
  it('verifies quantifiers', () => {
    expect(() => oneOrMore.match(lineStart).toString()).toThrow();
    expect(() => oneOrMore(match(lineStart)).toString()).toThrow();
  });
  it('cannot be negated', () => {
    expect(() => not.match(exactly`foo`).toString()).toThrow();
    expect(() => not(match(exactly`foo`)).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    expect(() => match().toString()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => match``.toString()).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => match(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => match('a', 1, 12)).toThrow();

    // @ts-expect-error - testing missing arguments
    expect(() => match.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => match.match(3).toString()).toThrow();
  });
});

describe('charIn', () => {
  it('accepts plain strings', () => {
    expect(charIn`abc`.toString()).toBe('[abc]');
    expect(charIn('abc').toString()).toBe('[abc]');
  });
  it('works with multiple values', () => {
    expect(charIn`abc``A-Z``0-9`.toString()).toBe('[abcA-Z0-9]');
    expect(charIn('0-9', 'A-Z', exactly`abc`).toString()).toBe('[0-9A-Zabc]');
    expect(charIn('abc')('def')(exactly`GHI`).toString()).toBe('[abcdefGHI]');
  });
  it('escapes properly', () => {
    expect(charIn`-abc``0-9``def-`.toString()).toBe('[-abc0-9def-]');
    expect(charIn`0-9``-abc``def-`.toString()).toBe('[0-9\\-abcdef-]');
    expect(charIn`[]`.toString()).toBe('[[\\]]');
    expect(charIn`^a[b]`.toString()).toBe('[\\^a[b\\]]');
    expect(charIn`(])`.toString()).toBe('[(\\])]');
    expect(charIn`\\`.toString()).toBe('[\\\\]');
    expect(charIn`\\\\`.toString()).toBe('[\\\\]');
    expect(charIn`a-z\\``s`.toString()).toBe('[a-z\\\\s]');
    expect(charIn`a-z``\\s`.toString()).toBe('[a-z\\s]');
    expect(charIn`ab-``z`.toString()).toBe('[ab\\-z]');
    expect(charIn`ab\\-``z`.toString()).toBe('[ab\\-z]');
  });
  it('is chainable and quantifiable', () => {
    expect(charIn`a``b``c`.char.toString()).toBe('[abc].');
    expect(oneOrMore.charIn`a``b`(exactly`c`.word).toString()).toBe('[abc\\w]+');
    expect(oneOrMore.charIn`a``b``c`(word).toString()).toBe('[abc\\w]+');
    expect(oneOrMore.charIn`abc${word}${digit}`.toString()).toBe('[abc\\w\\d]+');
    expect(oneOrMore.charIn`abc${unicode`0123`}${unicode`fe3d`}`.toString()).toBe('[abc\\u0123\\ufe3d]+');
  });
  it('can be negated', () => {
    expect(not.charIn`abc``A-Z``0-9`.toString()).toBe('[^abcA-Z0-9]');
    expect(not(charIn`abc``A-Z``0-9`).toString()).toBe('[^abcA-Z0-9]');
  });
  it('throws for invalid argument', () => {
    expect(charIn().toString()).toBe('[]');
    expect(charIn``.toString()).toBe('[]');
    // @ts-expect-error - testing invalid arguments
    expect(() => charIn(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => charIn('a', 1, 12)).toThrow();

    // @ts-expect-error - testing missing arguments
    expect(() => charIn.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => charIn.charIn(3).toString()).toThrow();
  });
});

describe('notCharIn', () => {
  it('accepts plain strings', () => {
    expect(notCharIn`abc`.toString()).toBe('[^abc]');
    expect(notCharIn('abc').toString()).toBe('[^abc]');
  });
  it('works with multiple values', () => {
    expect(notCharIn`abc``A-Z``0-9`.toString()).toBe('[^abcA-Z0-9]');
    expect(notCharIn('0-9', 'A-Z', exactly`abc`).toString()).toBe('[^0-9A-Zabc]');
    expect(notCharIn('abc')('def')(exactly`GHI`).toString()).toBe('[^abcdefGHI]');
  });
  it('escapes properly', () => {
    expect(notCharIn`-abc``0-9``def-`.toString()).toBe('[^-abc0-9def-]');
    expect(notCharIn`0-9``-abc``def-`.toString()).toBe('[^0-9\\-abcdef-]');
    expect(notCharIn`[]`.toString()).toBe('[^[\\]]');
    expect(notCharIn`^a[b]`.toString()).toBe('[^\\^a[b\\]]');
  });
  it('is chainable and quantifiable', () => {
    expect(notCharIn`a``b``c`.char.toString()).toBe('[^abc].');
    expect(oneOrMore.notCharIn`a``b`(exactly`c`.word).toString()).toBe('[^abc\\w]+');
    expect(oneOrMore.notCharIn`a``b``c`(word).toString()).toBe('[^abc\\w]+');
    expect(oneOrMore.notCharIn`abc${word}${digit}`.toString()).toBe('[^abc\\w\\d]+');
    expect(oneOrMore.notCharIn`abc${unicode`0123`}${unicode`fe3d`}`.toString()).toBe('[^abc\\u0123\\ufe3d]+');
  });
  it('cannot be negated', () => {
    expect(() => not.notCharIn`abc``A-Z``0-9`.toString()).toThrow();
    expect(() => not(notCharIn`abc``A-Z``0-9`).toString()).toThrow();
  });
  it('throws for invalid argument', () => {
    expect(notCharIn().toString()).toBe('[^]');
    expect(notCharIn``.toString()).toBe('[^]');
    // @ts-expect-error - testing invalid arguments
    expect(() => notCharIn(1)).toThrow();
    // @ts-expect-error - testing invalid arguments
    expect(() => notCharIn('a', 1, 12)).toThrow();

    // @ts-expect-error - testing missing arguments
    expect(() => notCharIn.toString()).toThrow('required parameters');
    // @ts-expect-error - testing missing arguments
    expect(() => notCharIn.notCharIn(3).toString()).toThrow();
  });
});

describe('quantifiers', () => {
  it('stacks properly', () => {
    expect(zeroOrMore.oneOrMore.exactly`foo`.toString()).toBe('(?:(?:foo)+)*');
    expect(zeroOrMore(oneOrMore(exactly`foo`)).toString()).toBe('(?:(?:foo)+)*');
    expect(zeroOrMore(digit.oneOrMore(exactly`foo`)).toString()).toBe('(?:\\d(?:foo)+)*');
  });
  it('adds brackets properly', () => {
    expect(oneOrMore.capture(exactly`[])`).toString()).toBe('(\\[\\]\\))+');
    expect(oneOrMore.capture.charIn`)[]`.toString()).toBe('([)[\\]])+');
    expect(oneOrMore(capture.charIn`)[]`.capture.exactly`([])`).toString()).toBe('(?:([)[\\]])(\\(\\[\\]\\)))+');
    expect(oneOrMore.capture.group.ahead.exactly`[])`.toString()).toBe('((?=\\[\\]\\)))+');
  });
  it('throws when quantifying nothing', () => {
    expect(() => oneOrMore.toString()).toThrow();
  });
});

describe('r', () => {
  it('exists', () => {
    expect(r).toBeDefined();
    expect(r.char).toEqual(char);
    expect(r.toRegExp).toBeDefined();
    expect(r.toString).toBeDefined();
  });
});
