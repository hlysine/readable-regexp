/*
const regex = oneOf`http``smtp``ftp`.maybe`s`.exactly`://`
  .captureAs('domain')
  .oneOf(
    oneOrMore(word).oneOrMore(exactly`.`.oneOrMore(word)),
    repeat(1, 3)(digit).repeat(3)(exactly`.`.repeat(1, 3)(digit))
  )
  .maybe(exactly`/`.capture.oneOrMore(charNotIn`?`))
  .maybe(exactly`?`.capture.oneOrMore(charIn`a-zA-Z0-9=&`));
*/

/*
===== No Input =====
char
whitespace
not.whitespace
digit
not.digit
word
not.word
verticalWhitespace
not.verticalWhitespace
lineFeed
not.lineFeed
carriageReturn
not.carriageReturn
tab
not.tab
nullChar
not.nullChar

lineStart
not.lineStart
lineEnd
not.lineEnd
wordBoundary
not.wordBoundary

===== Single Input =====
exactly`literal`
exactly('literal')

unicode`category`
unicode('category')

not.char
not(char)

repeat(3)`literal`
repeat(3)('literal')
repeat(3)(node)
repeat(3).node

repeat(3, 5)`literal`
repeat(3, 5)('literal')
repeat(3, 5)(node)
repeat(3, 5).node

atLeast(3)`literal`
atLeast(3)('literal')
atLeast(3)(node)
atLeast(3).node

atMost(3)`literal`
atMost(3)('literal')
atMost(3)(node)
atMost(3).node

maybe`literal`
maybe('literal')
maybe(node)
maybe.node

zeroOrMore`literal`
zeroOrMore('literal')
zeroOrMore(node)
zeroOrMore.node

oneOrMore`literal`
oneOrMore('literal')
oneOrMore(node)
oneOrMore.node

capture`literal`
capture('literal')
capture(node)
capture.node

captureAs`name``literal`
captureAs`name`('literal')
captureAs`name`(node)
captureAs`name`.node
captureAs('name')`literal`
captureAs('name')('literal')
captureAs('name')(node)
captureAs('name').node

ref`name`
ref('name')

group`literal`
group('literal')
group(node)
group.node

after`literal`
after('literal')
after(node)
after.node

before`literal`
before('literal')
before(node)
before.node

notAfter`literal`
notAfter('literal')
notAfter(node)
notAfter.node

notBefore`literal`
notBefore('literal')
notBefore(node)
notBefore.node

===== Multiple Input =====
charIn`a-zA-Z0-9=&`
charIn('a-zA-Z0-9=&')
charIn`a-zA-Z0-9=&`(whitespace)
charIn('a-zA-Z0-9=&', whitespace)
charIn('a-zA-Z0-9=&')(whitespace)

notCharIn`a-zA-Z0-9=&`
notCharIn('a-zA-Z0-9=&')
notCharIn`a-zA-Z0-9=&`(whitespace)
notCharIn('a-zA-Z0-9=&', whitespace)
notCharIn('a-zA-Z0-9=&')(whitespace)

oneOf`option1``option2``option3`
oneOf('option1', 'option2', 'option3')
oneOf('option1')('option2')('option3')

*/
