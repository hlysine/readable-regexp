import {
  carriageReturn,
  digit,
  exactly,
  lineFeed,
  not,
  nullChar,
  tab,
  verticalWhitespace,
  whitespace,
  word,
} from '../src/index';
import { NegatableTokenTag, NegatedToken, RegexToken } from '../src/types';

type TokenTestCase = [keyof NegatedToken, RegexToken & NegatableTokenTag, string, string?];
const testCases: TokenTestCase[] = [
  ['whitespace', whitespace, '\\s'],
  ['digit', digit, '\\d'],
  ['word', word, '\\w'],
  ['verticalWhitespace', verticalWhitespace, '\\v', '[^\\v]'],
  ['lineFeed', lineFeed, '\\n', '[^\\n]'],
  ['carriageReturn', carriageReturn, '\\r', '[^\\r]'],
  ['tab', tab, '\\t', '[^\\t]'],
  ['nullChar', nullChar, '\\0', '[^\\0]'],
];
function runTest([name, token, expected, negated]: TokenTestCase) {
  describe(name, () => {
    it('works', () => {
      expect(token.toString()).toBe(expected);
    });
    it('is chainable', () => {
      expect(token.exactly`foo`.toString()).toBe(expected + 'foo');
      expect(exactly`foo`[name].toString()).toBe('foo' + expected);
      expect(token[name][name].toString()).toBe(expected + expected + expected);
    });
    it('can be negated', () => {
      expect(not[name].toString()).toBe(negated ?? expected.toUpperCase());
      expect(not(token).toString()).toBe(negated ?? expected.toUpperCase());
    });
  });
}
testCases.forEach(runTest);
