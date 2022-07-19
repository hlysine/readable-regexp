import { char, exactly, oneOrMore } from '../src/index';

describe('exactly', () => {
  it('accepts plain strings', () => {
    expect(exactly`foo`).toHaveProperty('regex', 'foo');
    expect(exactly('foo')).toHaveProperty('regex', 'foo');
  });
  it('accepts template literals', () => {
    expect(exactly`foo${1}bar${2}`).toHaveProperty('regex', 'foo1bar2');
  });
});

describe('char', () => {
  it('works', () => {
    expect(char).toHaveProperty('regex', '.');
  });
  it('is chainable', () => {
    expect(char.exactly`foo`).toHaveProperty('regex', '.foo');
    expect(exactly`foo`.char).toHaveProperty('regex', 'foo.');
    expect(char.char.char).toHaveProperty('regex', '...');
  });
});

describe('oneOrMore', () => {
  it('accepts plain strings', () => {
    expect(oneOrMore`foo`).toHaveProperty('regex', '(?:foo)*');
    expect(oneOrMore('foo')).toHaveProperty('regex', '(?:foo)*');
  });
  it('accepts special tokens', () => {
    expect(oneOrMore(char)).toHaveProperty('regex', '(?:.)*');
    expect(oneOrMore.char).toHaveProperty('regex', '(?:.)*');
  });
  it('accepts expressions', () => {
    expect(oneOrMore(exactly`foo`)).toHaveProperty('regex', '(?:foo)*');
    expect(oneOrMore.exactly`foo`).toHaveProperty('regex', '(?:foo)*');
  });
});
