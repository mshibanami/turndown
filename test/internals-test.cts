const test = require('tape').test
const { edgeWhitespace } = require('../dist/index.cjs')

test('edge whitespace detection', function (t: any) {
  function ews(
    leadingAscii: string,
    leadingNonAscii: string,
    trailingNonAscii: string,
    trailingAscii: string
  ) {
    return {
      leading: leadingAscii + leadingNonAscii,
      leadingAscii,
      leadingNonAscii,
      trailing: trailingNonAscii + trailingAscii,
      trailingNonAscii,
      trailingAscii
    }
  }
  const WS = '\r\n \t'
  const TEST_CASES = [
    [`${WS}HELLO WORLD${WS}`, ews(WS, '', '', WS)],
    [`${WS}H${WS}`, ews(WS, '', '', WS)],
    [`${WS}\xa0${WS}HELLO${WS}WORLD${WS}\xa0${WS}`, ews(WS, `\xa0${WS}`, `${WS}\xa0`, WS)],
    [`\xa0${WS}HELLO${WS}WORLD${WS}\xa0`, ews('', `\xa0${WS}`, `${WS}\xa0`, '')],
    [`\xa0${WS}\xa0`, ews('', `\xa0${WS}\xa0`, '', '')],
    [`${WS}\xa0${WS}`, ews(WS, `\xa0${WS}`, '', '')],
    [`${WS}\xa0`, ews(WS, '\xa0', '', '')],
    ['HELLO WORLD', ews('', '', '', '')],
    ['', ews('', '', '', '')],
    [`TEST${Array(32768).join(' ')}END`, ews('', '', '', '')] // performance check
  ]
  t.plan(TEST_CASES.length)
  t.timeoutAfter(300)
  TEST_CASES.forEach(function (c) {
    t.deepEqual(edgeWhitespace(c[0]), c[1])
  })
})
