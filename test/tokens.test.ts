import {
  carriageReturn,
  char,
  digit,
  exactly,
  lineEnd,
  lineFeed,
  lineStart,
  not,
  nullChar,
  oneOrMore,
  tab,
  verticalWhitespace,
  whitespace,
  word,
  wordBoundary,
} from '../src/index';

const testCases = [
  ['char', char, '.'],
  ['whitespace', whitespace, '\\s'],
  ['digit', digit, '\\d'],
  ['word', word, '\\w'],
  ['verticalWhitespace', verticalWhitespace, '\\v'],
  ['lineFeed', lineFeed, '\\n'],
  ['carriageReturn', carriageReturn, '\\r'],
  ['tab', tab, '\\t'],
  ['nullChar', nullChar, '\\0'],
  ['lineStart', lineStart, '^'],
  ['lineEnd', lineEnd, '$'],
  ['wordBoundary', wordBoundary, '\\b'],
] as const;
function runTest([name, token, expected]: typeof testCases[number]): void {
  describe(name, () => {
    it('works', () => {
      expect(token.toString()).toBe(expected);
    });
    it('is chainable', () => {
      expect(token.exactly`foo`.toString()).toBe(expected + 'foo');
      expect(exactly`foo`[name].toString()).toBe('foo' + expected);
      expect(token[name][name].toString()).toBe(expected + expected + expected);
    });
  });
}
testCases.forEach(runTest);

describe('negation', () => {
  it('is negatable', () => {
    expect(not.whitespace.toString()).toBe('\\S');
    expect(not(whitespace).toString()).toBe('\\S');

    expect(not.digit.toString()).toBe('\\D');
    expect(not(digit).toString()).toBe('\\D');

    expect(not.word.toString()).toBe('\\W');
    expect(not(word).toString()).toBe('\\W');

    expect(not.verticalWhitespace.toString()).toBe('[^\\v]');
    expect(not(verticalWhitespace).toString()).toBe('[^\\v]');

    expect(not.lineFeed.toString()).toBe('[^\\n]');
    expect(not(lineFeed).toString()).toBe('[^\\n]');

    expect(not.carriageReturn.toString()).toBe('[^\\r]');
    expect(not(carriageReturn).toString()).toBe('[^\\r]');

    expect(not.tab.toString()).toBe('[^\\t]');
    expect(not(tab).toString()).toBe('[^\\t]');

    expect(not.nullChar.toString()).toBe('[^\\0]');
    expect(not(nullChar).toString()).toBe('[^\\0]');

    expect(not.lineStart.toString()).toBe('(?!^)');
    expect(not(lineStart).toString()).toBe('(?!^)');

    expect(not.lineEnd.toString()).toBe('(?!$)');
    expect(not(lineEnd).toString()).toBe('(?!$)');

    expect(not.wordBoundary.toString()).toBe('\\B');
    expect(not(wordBoundary).toString()).toBe('\\B');
  });
  it('is not negatable', () => {
    // @ts-expect-error - char is not negatable
    expect(() => not.char).toThrow();
    // @ts-expect-error - char is not negatable
    expect(() => not(char)).toThrow();
  });
});

describe('quantification', () => {
  it('is quantifiable', () => {
    expect(oneOrMore.char.toString()).toBe('.+');
    expect(oneOrMore(char).toString()).toBe('.+');

    expect(oneOrMore.whitespace.toString()).toBe('\\s+');
    expect(oneOrMore(whitespace).toString()).toBe('\\s+');

    expect(oneOrMore.digit.toString()).toBe('\\d+');
    expect(oneOrMore(digit).toString()).toBe('\\d+');

    expect(oneOrMore.word.toString()).toBe('\\w+');
    expect(oneOrMore(word).toString()).toBe('\\w+');

    expect(oneOrMore.verticalWhitespace.toString()).toBe('\\v+');
    expect(oneOrMore(verticalWhitespace).toString()).toBe('\\v+');

    expect(oneOrMore.lineFeed.toString()).toBe('\\n+');
    expect(oneOrMore(lineFeed).toString()).toBe('\\n+');

    expect(oneOrMore.carriageReturn.toString()).toBe('\\r+');
    expect(oneOrMore(carriageReturn).toString()).toBe('\\r+');

    expect(oneOrMore.tab.toString()).toBe('\\t+');
    expect(oneOrMore(tab).toString()).toBe('\\t+');

    expect(oneOrMore.nullChar.toString()).toBe('\\0+');
    expect(oneOrMore(nullChar).toString()).toBe('\\0+');
  });
  it('is not quantifiable', () => {
    // @ts-expect-error - lineStart is not quantifiable
    expect(() => oneOrMore.lineStart).toThrow();
    // @ts-expect-error - lineStart is not quantifiable
    expect(() => oneOrMore(lineStart)).toThrow();
    // @ts-expect-error - lineStart is negated with lookahead, which can technically be quantified but has no effect
    expect(oneOrMore.not.lineStart.toString()).toBe('(?:(?!^))+');
    // @ts-expect-error - lineStart is negated with lookahead, which can technically be quantified but has no effect
    expect(oneOrMore(not(lineStart)).toString()).toBe('(?:(?!^))+');

    // @ts-expect-error - lineEnd is not quantifiable
    expect(() => oneOrMore.lineEnd).toThrow();
    // @ts-expect-error - lineEnd is not quantifiable
    expect(() => oneOrMore(lineEnd)).toThrow();
    // @ts-expect-error - lineEnd is negated with lookahead, which can technically be quantified but has no effect
    expect(oneOrMore.not.lineEnd.toString()).toBe('(?:(?!$))+');
    // @ts-expect-error - lineEnd is negated with lookahead, which can technically be quantified but has no effect
    expect(oneOrMore(not(lineEnd)).toString()).toBe('(?:(?!$))+');

    // @ts-expect-error - wordBoundary is not quantifiable
    expect(() => oneOrMore.wordBoundary).toThrow();
    // @ts-expect-error - wordBoundary is not quantifiable
    expect(() => oneOrMore(wordBoundary)).toThrow();
    // @ts-expect-error - wordBoundary is not quantifiable
    expect(() => oneOrMore.not.wordBoundary).toThrow();
    // @ts-expect-error - wordBoundary is not quantifiable
    expect(() => oneOrMore(not(wordBoundary))).toThrow();
  });
});
