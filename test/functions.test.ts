import {
  atLeast,
  atMost,
  char,
  exactly,
  maybe,
  not,
  oneOf,
  oneOrMore,
  repeat,
  unicode,
  whitespace,
  zeroOrMore,
} from '../src/index';

describe('exactly', () => {
  it('accepts plain strings', () => {
    expect(exactly`foo`.toString()).toBe('foo');
    expect(exactly('foo').toString()).toBe('foo');
  });
  it('accepts template literals', () => {
    expect(exactly`foo${1}bar${2}`.toString()).toBe('foo1bar2');
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
    expect(unicode`FFFF`.toString()).toBe('\\uFFFF');
    expect(unicode`aBcD`.toString()).toBe('\\uaBcD');
    expect(() => unicode``).toThrow();
    expect(() => unicode`g1h2`).toThrow();
    expect(() => unicode`123`).toThrow();
    expect(() => unicode`123ef`).toThrow();
  });
  it('can be negated and quantified', () => {
    expect(not.unicode`12ef`.toString()).toBe('[^\\u12ef]');
    expect(oneOrMore.unicode`12ef`.toString()).toBe('\\u12ef+');
    expect(oneOrMore.not.unicode`12ef`.toString()).toBe('(?:[^\\u12ef])+');
  });
});

describe('not', () => {
  it('is chainable', () => {
    expect(not.whitespace.exactly`foo`.toString()).toBe('\\Sfoo');
    expect(exactly`foo`.not.whitespace.toString()).toBe('foo\\S');
    expect(not.whitespace.not(whitespace).not.whitespace.toString()).toBe('\\S\\S\\S');
  });
  it('does not allow non-negatable tokens', () => {
    // @ts-expect-error - not(char) is not negatable
    expect(() => not(char)).toThrow();
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
});

describe('atMost', () => {
  it('accepts plain strings', () => {
    expect(atMost(3)`foo`.toString()).toBe('(?:foo){,3}');
    expect(atMost(3)('foo').toString()).toBe('(?:foo){,3}');
  });
  it('accepts special tokens', () => {
    expect(atMost(3)(char).toString()).toBe('.{,3}');
    expect(atMost(3).char.toString()).toBe('.{,3}');
  });
  it('accepts expressions', () => {
    expect(atMost(3)(exactly`foo`).toString()).toBe('(?:foo){,3}');
    expect(atMost(3).exactly`foo`.toString()).toBe('(?:foo){,3}');
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
    expect(oneOrMore.oneOf`foo``bar`(exactly`baz`.char).toString()).toBe('(?:(?:foo|bar|baz.))+');
  });
});
