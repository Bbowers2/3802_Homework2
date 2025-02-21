import { describe, it } from "node:test";
import assert from "assert";
import * as ohm from "ohm-js";

const grammars = {
  canadianPostalCode: String.raw`
    postalCode = ~notFirstLetter canadaChar digit canadaChar " " digit canadaChar digit
    canadaChar = ~notLegalChar "A".."Z"
    notLegalChar = "D" | "F" | "I" | "O" | "Q" | "U"
    notFirstLetter = "W" | "Z"
  `,

  visa: String.raw`
    cardNum = "4" (fifteenDigits | twelveDigits)
   	fifteenDigits = d d d d d d d d d d d d d d d
	  twelveDigits = d d d d d d d d d d d d
    d = digit
  `,

  masterCard: String.raw`
    cardNum  = ("5" "1".."5" fourteenDigits) 		--startwith5
    				 | (validNum twelveDigits)				--startwith2
   	fourteenDigits = d d d d d d d d d d d d d d
	  twelveDigits = d d d d d d d d d d d d
    d = digit
	  validNum = "2" "2" "2" "1".."9" --from2221to2229
             | "2" "2" "3".."9" digit --from2230to2299
    				 | "2" "3".."6" digit digit  --from2300to2699
             | "2" "7" ("0" | "1") digit	--from2700to2719
             | "2" "7" "2" "0"			--just2720
    `,

  notThreeEndingInOO: String.raw`
    string = letter? part?
    part = ~illegal letter letter*			--OK
    		| illegal ~illegal letter*			--alsoOK
  			| illegal illegal letter+			--grtThanThree
	  illegal = "O" | "o"
  `,

  divisibleBy16: String.raw`
	  num = "1" nums		--largeNum
    		| "0"+
    nums = "1" (zeros ~any | nums) --num
    			| "0" ( threes | nums) --number
    zeros = "0" "0" "0" "0" ~any
    threes = "0" "0" "0" ~any
      `,

  eightThroughThirtyTwo: String.raw`
	  eightThru32  = single
    					   | ("1" | "2") digit 	--twoDigits
                 | "3" "0".."2"			--two
	  single = "8" | "9"   `,

  notPythonPycharmPyc: String.raw`
    string = keywords letter+			--notKeyword
    			| ~keywords letter* 
    keywords = "python" | "pycharm" | "pyc"  `,

  restrictedFloats: String.raw`
    num = digit* decimal? exponent
    exponent = ("e" | "E")  ("+" | "-")? digit digit? digit?
    decimal = "." digit*  `,

  palindromes2358: String.raw`
    	palindromes = a six a 		--eightCharA
    				| b six b			--eightCharB
                    | c six c			--eightCharC
                    | a three a			--fiveCharA
                    | b three b			--fiveCharB
                    |c three c				--fiveCharC
                    | three 				
                    | two
    six = a four a
    		| b four b
            | c four c
            
     four = a two a
     		| b two b
            | c two c
            
     three = a letter a
     			| b letter b
                | c letter c
            
     two = a a | b b | c c

	letters = a | b | c
    a = "a"
    b = "b"
    c = "c"
  `,

  pythonStringLiterals: String.raw`
  stringliteral   = stringprefix? (longstring | shortstring)
  stringprefix    =  "r" | "u" | "R" | "U" | "f" | "F"
                       | "fr" | "Fr" | "fR" | "FR" | "rf" | "rF" | "Rf" | "RF"
  shortstring     =  ("\'" shortstringitem* "\'") | ("\"" shortstringitem* "\"")
  longstring      =  ("\'\'\'" longstringitem* "\'\'\'") | ("\"\"\"" longstringitem* "\"\"\"")
  shortstringitem =  shortstringchar | stringescapeseq
  longstringitem  =  longstringchar | stringescapeseq
  shortstringchar =  ~"\"" ~"\'" ~"\n" ~"\\" any
  longstringchar  =  ~"\"\"\"" ~"\'\'\'" ~"\\" any
  stringescapeseq =  "\\" any
  `,
};

function matches(name, string) {
  const grammar = `G {${grammars[name]}}`;
  return ohm.grammar(grammar).match(string).succeeded();
}

const testFixture = {
  canadianPostalCode: {
    good: ["A7X 2P8", "P8E 4R2", "K1V 9P2", "Y3J 5C0"],
    bad: [
      "A7X   9B2",
      "C7E 9U2",
      "",
      "Dog",
      "K1V\t9P2",
      " A7X 2P8",
      "A7X 2P8 ",
    ],
  },
  visa: {
    good: ["4128976567772613", "4089655522138888", "4098562516243"],
    bad: [
      "43333",
      "42346238746283746823",
      "7687777777263211",
      "foo",
      "π",
      "4128976567772613 ",
    ],
  },
  masterCard: {
    good: [
      "5100000000000000",
      "5294837679998888",
      "5309888182838282",
      "5599999999999999",
      "2221000000000000",
      "2720999999999999",
      "2578930481258783",
      "2230000000000000",
    ],
    bad: [
      "5763777373890002",
      "513988843211541",
      "51398884321108541",
      "",
      "OH",
      "5432333xxxxxxxxx",
    ],
  },
  notThreeEndingInOO: {
    good: ["", "fog", "Tho", "one", "a", "ab", "food"],
    bad: ["fOo", "gOO", "HoO", "zoo", "MOO", "123", "A15"],
  },
  divisibleBy16: {
    good: [
      "0",
      "00",
      "000",
      "00000",
      "00000",
      "000000",
      "00000000",
      "1101000000",
    ],
    bad: ["1", "00000000100", "1000000001", "dog0000000"],
  },
  eightThroughThirtyTwo: {
    good: Array(25)
      .fill(0)
      .map((x, i) => i + 8),
    bad: ["1", "0", "00003", "dog", "", "361", "90", "7", "-11"],
  },
  notPythonPycharmPyc: {
    good: [
      "",
      "pythons",
      "pycs",
      "PYC",
      "apycharm",
      "zpyc",
      "dog",
      "pythonpyc",
    ],
    bad: ["python", "pycharm", "pyc"],
  },
  restrictedFloats: {
    good: ["1e0", "235e9", "1.0e1", "1.0e+122", "55e20"],
    bad: ["3.5E9999", "2.355e-9991", "1e2210"],
  },
  palindromes2358: {
    good: [
      "aa",
      "bb",
      "cc",
      "aaa",
      "aba",
      "aca",
      "bab",
      "bbb",
      "ababa",
      "abcba",
      "aaaaaaaa",
      "abaaaaba",
      "cbcbbcbc",
      "caaaaaac",
    ],
    bad: ["", "a", "ab", "abc", "abbbb", "cbcbcbcb"],
  },
  pythonStringLiterals: {
    good: String.raw`''
        ""
        'hello'
        "world"
        'a\'b'
        "a\"b"
        '\n'
        "a\tb"
        f'\u'
        """abc"""
        '''a''"''"'''
        """abc\xdef"""
        '''abc\$def'''
        '''abc\''''`
      .split("\n")
      .map((s) => s.trim()),
    bad: String.raw`
        'hello"
        "world'
        'a'b'
        "a"b"
        'a''
        "x""
        """"""""
        frr"abc"
        'a\'
        '''abc''''
        """`
      .split("\n")
      .map((s) => s.trim()),
  },
};

for (let name of Object.keys(testFixture)) {
  describe(`when matching ${name}`, () => {
    for (let s of testFixture[name].good) {
      it(`accepts ${s}`, () => {
        assert.ok(matches(name, s));
      });
    }
    for (let s of testFixture[name].bad) {
      it(`rejects ${s}`, () => {
        assert.ok(!matches(name, s));
      });
    }
  });
}
