import { char, exactly, oneOrMore } from '../src/index';

describe('exactly', () => {
  it('works', () => {
    expect(exactly`foo`).toHaveProperty('regex', 'foo');
    expect(exactly('foo')).toHaveProperty('regex', 'foo');
    expect(exactly`foo${1}bar${2}`).toHaveProperty('regex', 'foo1bar2');
  });
});

describe('char', () => {
  it('works', () => {
    expect(char).toHaveProperty('regex', '.');
  });
});

describe('oneOrMore', () => {
  it('works', () => {
    expect(oneOrMore`foo`).toHaveProperty('regex', '(?:foo)*');
    expect(oneOrMore('foo')).toHaveProperty('regex', '(?:foo)*');
    expect(oneOrMore(char)).toHaveProperty('regex', '(?:.)*');
    expect(oneOrMore.char).toHaveProperty('regex', '(?:.)*');
  });
});

describe('chaining', () => {
  it('works', () => {
    expect(exactly`foo`.char).toHaveProperty('regex', 'foo.');
  });
});
