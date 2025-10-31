import Turnish from '../src';
import { describe, it, expect } from 'vitest';
import { Rule } from '@/rules';
import { ExtendedNode } from '@/node';
import { noBreakSpace, read } from './utilities';

describe('Turnish', () => {
    it('parses p tag', () => {
        const turnish = new Turnish();
        const input = '<p>Lorem ipsum</p>';
        expect(turnish.render(input)).toBe('Lorem ipsum');
    });

    it('malformed documents', () => {
        const turnish = new Turnish();
        expect(() => {
            turnish.render('<HTML><head></head><BODY><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><body onload=alert(document.cookie);></body></html>');
        }).not.toThrow();
    });

    it('null input', () => {
        const turnish = new Turnish();
        expect(() => turnish.render(null as any)).toThrow(/null is not a string/);
    });

    it('undefined input', () => {
        const turnish = new Turnish();
        expect(() => turnish.render(undefined as any)).toThrow(/undefined is not a string/);
    });

    it('#addRule returns the instance', () => {
        const turnish = new Turnish();
        const rule = {
            filter: ['del', 's', 'strike'],
            replacement: (content: string) => '~~' + content + '~~'
        };
        expect(turnish.addRule('strikethrough', rule)).toBe(turnish);
    });

    it('#addRule adds the rule', () => {
        const turnish = new Turnish();
        const rule = {
            filter: ['del', 's', 'strike'],
            replacement: (content: string) => '~~' + content + '~~'
        };
        let called = false;
        turnish.rules.add = (key: string, rule: Rule) => {
            expect(key).toBe('strikethrough');
            expect(rule).toBe(rule);
            called = true;
        };
        turnish.addRule('strikethrough', rule);
        expect(called).toBe(true);
    });

    it('#use returns the instance for chaining', () => {
        const turnish = new Turnish();
        expect(turnish.use(function plugin() { })).toBe(turnish);
    });

    it('#use with a single plugin calls the fn with instance', () => {
        const turnish = new Turnish();
        let called = false;
        function plugin(service: Turnish) {
            expect(service).toBe(turnish);
            called = true;
        }
        turnish.use(plugin);
        expect(called).toBe(true);
    });

    it('#use with multiple plugins calls each fn with instance', () => {
        const turnish = new Turnish();
        let called1 = false, called2 = false;
        function plugin1(service: Turnish) {
            expect(service).toBe(turnish);
            called1 = true;
        }
        function plugin2(service: Turnish) {
            expect(service).toBe(turnish);
            called2 = true;
        }
        turnish.use([plugin1, plugin2]);
        expect(called1).toBe(true);
        expect(called2).toBe(true);
    });

    it('#keep keeps elements as HTML', () => {
        const turnish = new Turnish();
        const input = '<p>Hello <del>world</del><ins>World</ins></p>';
        expect.soft(turnish.render(input)).toBe('Hello worldWorld');
        turnish.keep(['del']);
        expect.soft(turnish.render(input)).toBe('Hello <del>world</del>World');
        turnish.keep(['ins']);
        expect.soft(turnish.render(input)).toBe('Hello <del>world</del><ins>World</ins>');
    });

    it('#keep returns the Turnish instance for chaining', () => {
        const turnish = new Turnish();
        expect(turnish.keep(['del', 'ins'])).toBe(turnish);
    });

    it('keep rules are overridden by the standard rules', () => {
        const turnish = new Turnish();
        turnish.keep('p');
        expect(turnish.render('<p>Hello world</p>')).toBe('Hello world');
    });

    it('keeping elements that have a blank textContent but contain significant elements', () => {
        const turnish = new Turnish();
        turnish.keep('figure');
        expect(turnish.render('<figure><iframe src="http://example.com"></iframe></figure>')).toBe('<figure><iframe src="http://example.com"></iframe></figure>');
    });

    it('keepReplacement can be customised', () => {
        const turnish = new Turnish({
            keepReplacement: (content: string, node: ExtendedNode) => '\n\n' + node.outerHTML + '\n\n'
        });
        turnish.keep(['del', 'ins']);
        expect(turnish.render('<p>Hello <del>world</del><ins>World</ins></p>')).toBe('Hello \n\n<del>world</del>\n\n<ins>World</ins>');
    });

    it('#remove removes elements', () => {
        const turnish = new Turnish();
        const input = '<del>Please redact me</del>';
        expect(turnish.render(input)).toBe('Please redact me');
        turnish.remove('del');
        expect(turnish.render(input)).toBe('');
    });

    it('#remove returns the Turnish instance for chaining', () => {
        const turnish = new Turnish();
        expect(turnish.remove(['del', 'ins'])).toBe(turnish);
    });

    it('remove elements are overridden by rules', () => {
        const turnish = new Turnish();
        turnish.remove('p');
        expect(turnish.render('<p>Hello world</p>')).toBe('Hello world');
    });

    it('remove elements are overridden by keep', () => {
        const turnish = new Turnish();
        turnish.keep(['del', 'ins']);
        turnish.remove(['del', 'ins']);
        expect(turnish.render('<p>Hello <del>world</del><ins>World</ins></p>')).toBe('Hello <del>world</del><ins>World</ins>');
    });

    it('has no newline in the text of a link', () => {
        const turnish = new Turnish();
        expect.soft(turnish
            .render('<a href="http://example.com">Example Link</a>'))
            .toBe('[Example Link](http://example.com)');
        expect.soft(turnish
            .render('<a href="http://example.com"><p>Example Link</p></a>'))
            .toBe('[Example Link](http://example.com)');
        expect.soft(turnish
            .render('<a href="http://example.com"><span>Example<br/>Link</span></a>'))
            .toBe('[Example Link](http://example.com)');
    });

    it('multiple ps', () => {
        const turnish = new Turnish();
        const input = '<p>Lorem</p>\n<p>ipsum</p>\n<p>sit</p>';
        expect(turnish.render(input)).toBe('Lorem\n\nipsum\n\nsit');
    });

    it('em', () => {
        const turnish = new Turnish();
        const input = '<em>em element</em>';
        expect(turnish.render(input)).toBe('*em element*');
    });

    it('i', () => {
        const turnish = new Turnish();
        const input = '<i>i element</i>';
        expect(turnish.render(input)).toBe('*i element*');
    });

    it('strong', () => {
        const turnish = new Turnish();
        const input = '<strong>strong element</strong>';
        expect(turnish.render(input)).toBe('**strong element**');
    });

    it('b', () => {
        const turnish = new Turnish();
        const input = '<b>b element</b>';
        expect(turnish.render(input)).toBe('**b element**');
    });

    it('code', () => {
        const turnish = new Turnish();
        const input = '<code>code element</code>';
        expect(turnish.render(input)).toBe('`code element`');
    });

    it('code containing a backtick', () => {
        const turnish = new Turnish();
        const input = '<code>There is a literal backtick (`) here</code>';
        expect(turnish.render(input)).toBe('``There is a literal backtick (`) here``');
    });

    it('code containing three or more backticks', () => {
        const turnish = new Turnish();
        const input = '<code>here are three ``` here are four ```` that\'s it</code>';
        expect(turnish.render(input)).toBe("`here are three ``` here are four ```` that's it`");
    });

    it('code containing one or more backticks', () => {
        const turnish = new Turnish();
        const input = '<code>here are three ``` here are four ```` here is one ` that\'s it</code>';
        expect(turnish.render(input)).toBe("``here are three ``` here are four ```` here is one ` that's it``");
    });

    it('code starting with a backtick', () => {
        const turnish = new Turnish();
        const input = '<code>`starting with a backtick</code>';
        expect(turnish.render(input)).toBe('`` `starting with a backtick ``');
    });


    it('code containing markdown syntax', () => {
        const turnish = new Turnish();
        const input = "<code>_emphasis_</code>";
        expect(turnish.render(input)).toBe("`_emphasis_`");
    });

    it('code containing markdown syntax in a span', () => {
        const turnish = new Turnish();
        const input = "<code><span>_emphasis_</span></code>";
        expect(turnish.render(input)).toBe("`_emphasis_`");
    });

    it('h1', () => {
        const turnish = new Turnish();
        const input = "<h1>Level One Heading</h1>";
        expect(turnish.render(input)).toBe("# Level One Heading");
    });

    it('escape = when used as heading', () => {
        const turnish = new Turnish();
        const input = "===";
        expect(turnish.render(input)).toBe("\\===");
    });

    it('not escaping = outside of a heading', () => {
        const turnish = new Turnish();
        const input = "A sentence containing =";
        expect(turnish.render(input)).toBe("A sentence containing =");
    });

    it('h1 as atx', () => {
        const turnish = new Turnish({ "headingStyle": "atx" });
        const input = "<h1>Level One Heading with ATX</h1>";
        expect(turnish.render(input)).toBe("# Level One Heading with ATX");
    });

    it('h2', () => {
        const turnish = new Turnish();
        const input = "<h2>Level Two Heading</h2>";
        expect(turnish.render(input)).toBe("## Level Two Heading");
    });

    it('h2 as setext', () => {
        const turnish = new Turnish({ "headingStyle": "setext" });
        const input = "<h2>Level Two Heading with ATX</h2>";
        expect(turnish.render(input)).toBe("Level Two Heading with ATX\n--------------------------");
    });

    it('h3', () => {
        const turnish = new Turnish();
        const input = "<h3>Level Three Heading</h3>";
        expect(turnish.render(input)).toBe("### Level Three Heading");
    });

    it('heading with child', () => {
        const turnish = new Turnish();
        const input = "<h4>Level Four Heading with <code>child</code></h4>";
        expect(turnish.render(input)).toBe("#### Level Four Heading with `child`");
    });

    it('invalid heading', () => {
        const turnish = new Turnish();
        const input = "<h7>Level Seven Heading?</h7>";
        expect(turnish.render(input)).toBe("Level Seven Heading?");
    });

    it('hr', () => {
        const turnish = new Turnish();
        const input = "<hr>";
        expect(turnish.render(input)).toBe("---");
    });

    it('hr with closing tag', () => {
        const turnish = new Turnish();
        const input = "<hr></hr>";
        expect(turnish.render(input)).toBe("---");
    });

    it('hr with option', () => {
        const turnish = new Turnish({ "hr": "- - -" });
        const input = "<hr>";
        expect(turnish.render(input)).toBe("- - -");
    });

    it('br', () => {
        const turnish = new Turnish();
        const input = "More<br>after the break";
        expect(turnish.render(input)).toBe("More  \nafter the break");
    });

    it('br with visible line-ending', () => {
        const turnish = new Turnish({ "br": "\\" });
        const input = "More<br>after the break";
        expect(turnish.render(input)).toBe("More\\\nafter the break");
    });

    it('img with no alt', () => {
        const turnish = new Turnish();
        const input = "<img src=\"http://example.com/logo.png\" />";
        expect(turnish.render(input)).toBe("![](http://example.com/logo.png)");
    });

    it('img with relative src', () => {
        const turnish = new Turnish();
        const input = "<img src=\"logo.png\">";
        expect(turnish.render(input)).toBe("![](logo.png)");
    });

    it('img with alt', () => {
        const turnish = new Turnish();
        const input = "<img src=\"logo.png\" alt=\"img with alt\">";
        expect(turnish.render(input)).toBe("![img with alt](logo.png)");
    });

    it('img with no src', () => {
        const turnish = new Turnish();
        const input = "<img>";
        expect(turnish.render(input)).toBe("");
    });

    it('img with a new line in alt', () => {
        const turnish = new Turnish();
        const input = "<img src=\"logo.png\" alt=\"img with\n    alt\">";
        expect(turnish.render(input)).toBe("![img with alt](logo.png)");
    });

    it('img with more than one new line in alt', () => {
        const turnish = new Turnish();
        const input = "<img src=\"logo.png\" alt=\"img with\n    \n    alt\">";
        expect(turnish.render(input)).toBe("![img with alt](logo.png)");
    });

    it('img with new lines in title', () => {
        const turnish = new Turnish();
        const input = "<img src=\"logo.png\" title=\"the\n    \n    title\">";
        expect(turnish.render(input)).toBe("![](logo.png \"the title\")");
    });

    it('a', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com\">An anchor</a>";
        expect(turnish.render(input)).toBe("[An anchor](http://example.com)");
    });

    it('a with title', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com\" title=\"Title for link\">An anchor</a>";
        expect(turnish.render(input)).toBe("[An anchor](http://example.com \"Title for link\")");
    });

    it('a with multiline title', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com\" title=\"Title for\n    \n    link\">An anchor</a>";
        expect(turnish.render(input)).toBe("[An anchor](http://example.com \"Title for link\")");
    });

    it('a with quotes in title', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com\" title=\"&quot;hello&quot;\">An anchor</a>";
        expect(turnish.render(input)).toBe("[An anchor](http://example.com \"\\\"hello\\\"\")");
    });

    it('a with parenthesis in query', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com?(query)\">An anchor</a>";
        expect(turnish.render(input)).toBe("[An anchor](http://example.com?\\(query\\))");
    });

    it('a without a src', () => {
        const turnish = new Turnish();
        const input = "<a id=\"about-anchor\">Anchor without a title</a>";
        expect(turnish.render(input)).toBe("Anchor without a title");
    });

    it('a with a child', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com/code\">Some <code>code</code></a>";
        expect(turnish.render(input)).toBe("[Some `code`](http://example.com/code)");
    });

    it('a reference', () => {
        const turnish = new Turnish({ linkStyle: "referenced" });
        const input = "<a href=\"http://example.com\">Reference link</a>";
        expect(turnish.render(input)).toBe("[Reference link][1]\n\n[1]: http://example.com");
    });

    it('a reference with collapsed style', () => {
        const turnish = new Turnish({ linkStyle: "referenced", linkReferenceStyle: "collapsed" });
        const input = "<a href=\"http://example.com\">Reference link with collapsed style</a>";
        expect(turnish.render(input)).toBe("[Reference link with collapsed style][]\n\n[Reference link with collapsed style]: http://example.com");
    });

    it('a reference with shortcut style', () => {
        const turnish = new Turnish({ linkStyle: "referenced", linkReferenceStyle: "shortcut" });
        const input = "<a href=\"http://example.com\">Reference link with shortcut style</a>";
        expect(turnish.render(input)).toBe("[Reference link with shortcut style]\n\n[Reference link with shortcut style]: http://example.com");
    });

    it('multiple full references with deduplication', () => {
        const turnish = new Turnish({ linkStyle: "referenced", linkReferenceStyle: "full", linkReferenceDeduplication: "none" });
        const input = "<a href=\"http://example.com/a\">Reference Link 1</a> <a href=\"http://example.com/b\">Reference Link 2</a> <a href=\"http://example.com/a\">Reference Link 3</a>";
        expect.soft(turnish.render(input))
            .toBe("[Reference Link 1][1] [Reference Link 2][2] [Reference Link 3][3]\n\n[1]: http://example.com/a\n[2]: http://example.com/b\n[3]: http://example.com/a");
        turnish.options.linkReferenceDeduplication = "full";
        expect.soft(turnish.render(input))
            .toBe("[Reference Link 1][1] [Reference Link 2][2] [Reference Link 3][1]\n\n[1]: http://example.com/a\n[2]: http://example.com/b");
    });

    it('multiple shortcut references with deduplication', () => {
        const turnish = new Turnish({ linkStyle: "referenced", linkReferenceStyle: "shortcut", linkReferenceDeduplication: "full" });
        const input = "<a href=\"http://example.com/a\" title=\"Title A\">Reference Link 1</a> <a href=\"http://example.com/b\" title=\"Title B\">Reference Link 2</a> <a href=\"http://example.com/a\" title=\"Title A\">Reference Link 1</a>";
        expect.soft(turnish.render(input)).toBe("[Reference Link 1] [Reference Link 2] [Reference Link 1]\n\n[Reference Link 1]: http://example.com/a \"Title A\"\n[Reference Link 2]: http://example.com/b \"Title B\"");
    });

    it('pre/code block', () => {
        const turnish = new Turnish();
        const input = read('pre-code-block.html');
        expect(turnish.render(input)).toBe(read('pre-code-block.md'));
    });

    it('multiple pre/code blocks', () => {
        const turnish = new Turnish();
        const input = read('multiple-pre-code-blocks.html');
        expect(turnish.render(input)).toBe(read('multiple-pre-code-blocks.md'));
    });

    it('pre/code block with multiple new lines', () => {
        const turnish = new Turnish();
        const input = read('pre-code-block-with-multiple-new-lines.html');
        expect(turnish.render(input)).toBe(read('pre-code-block-with-multiple-new-lines.md'));
    });

    it('fenced pre/code block', () => {
        const turnish = new Turnish({ codeBlockStyle: "fenced" });
        const input = "<pre><code>def a_fenced_code block; end</code></pre>";
        expect(turnish.render(input)).toBe("```\ndef a_fenced_code block; end\n```");
    });

    it('pre/code block fenced with ~', () => {
        const turnish = new Turnish({ codeBlockStyle: "fenced", fence: "~~~" });
        const input = "<pre><code>def a_fenced_code block; end</code></pre>";
        expect(turnish.render(input)).toBe("~~~\ndef a_fenced_code block; end\n~~~");
    });

    it('escaping ~~~', () => {
        const turnish = new Turnish();
        const input = "<pre>~~~ foo</pre>";
        expect(turnish.render(input)).toBe("\\~~~ foo");
    });

    it('not escaping ~~~', () => {
        const turnish = new Turnish();
        const input = "A sentence containing ~~~";
        expect(turnish.render(input)).toBe("A sentence containing ~~~");
    });

    it('fenced pre/code block with language', () => {
        const turnish = new Turnish({ codeBlockStyle: "fenced" });
        const input = "<pre><code class=\"language-ruby\">def a_fenced_code block; end</code></pre>";
        expect(turnish.render(input)).toBe("```ruby\ndef a_fenced_code block; end\n```");
    });

    it('empty pre does not throw error', () => {
        const turnish = new Turnish();
        const input = "<pre></pre>";
        expect(turnish.render(input)).toBe("");
    });

    it('ol', () => {
        const turnish = new Turnish();
        const input = "<ol>\n      <li>Ordered list item 1</li>\n      <li>Ordered list item 2</li>\n      <li>Ordered list item 3</li>\n    </ol>";
        expect(turnish.render(input)).toBe("1. Ordered list item 1\n2. Ordered list item 2\n3. Ordered list item 3");
    });

    it('ol with start', () => {
        const turnish = new Turnish();
        const input = "<ol start=\"42\">\n      <li>Ordered list item 42</li>\n      <li>Ordered list item 43</li>\n      <li>Ordered list item 44</li>\n    </ol>";
        expect(turnish.render(input)).toBe("42. Ordered list item 42\n43. Ordered list item 43\n44. Ordered list item 44");
    });

    it('ol with content', () => {
        const turnish = new Turnish();
        const input = "<ol start=\"42\">\n      <li>\n        <p>Ordered list item 42</p>\n        <p>Ordered list's additional content</p>\n      </li>\n    </ol>";
        expect(turnish.render(input)).toBe("42. Ordered list item 42\n    \n    Ordered list's additional content");
    });

    it('list spacing', () => {
        const turnish = new Turnish();
        const input = "<p>A paragraph.</p>\n    <ol>\n      <li>Ordered list item 1</li>\n      <li>Ordered list item 2</li>\n      <li>Ordered list item 3</li>\n    </ol>\n    <p>Another paragraph.</p>\n    <ul>\n      <li>Unordered list item 1</li>\n      <li>Unordered list item 2</li>\n      <li>Unordered list item 3</li>\n    </ul>";
        expect(turnish.render(input)).toBe("A paragraph.\n\n1. Ordered list item 1\n2. Ordered list item 2\n3. Ordered list item 3\n\nAnother paragraph.\n\n- Unordered list item 1\n- Unordered list item 2\n- Unordered list item 3");
    });

    it('ul', () => {
        const turnish = new Turnish();
        const input = "<ul>\n      <li>Unordered list item 1</li>\n      <li>Unordered list item 2</li>\n      <li>Unordered list item 3</li>\n    </ul>";
        expect(turnish.render(input)).toBe("- Unordered list item 1\n- Unordered list item 2\n- Unordered list item 3");
    });

    it('ul with custom bullet', () => {
        const turnish = new Turnish({ bulletListMarker: "-" });
        const input = "<ul>\n      <li>Unordered list item 1</li>\n      <li>Unordered list item 2</li>\n      <li>Unordered list item 3</li>\n    </ul>";
        expect(turnish.render(input)).toBe("- Unordered list item 1\n- Unordered list item 2\n- Unordered list item 3");
    });

    it('ul with paragraph', () => {
        const turnish = new Turnish();
        const input = "<ul>\n      <li><p>List item with paragraph</p></li>\n      <li>List item without paragraph</li>\n    </ul>";
        expect(turnish.render(input)).toBe("- List item with paragraph\n    \n- List item without paragraph");
    });

    it('ol with paragraphs', () => {
        const turnish = new Turnish();
        const input = "<ol>\n      <li>\n        <p>This is a paragraph in a list item.</p>\n        <p>This is a paragraph in the same list item as above.</p>\n      </li>\n      <li>\n        <p>A paragraph in a second list item.</p>\n      </li>\n    </ol>";
        expect(turnish.render(input)).toBe("1. This is a paragraph in a list item.\n    \n    This is a paragraph in the same list item as above.\n    \n2. A paragraph in a second list item.");
    });

    it('nested uls', () => {
        const turnish = new Turnish();
        const input = read('nested-uls.html');
        expect(turnish.render(input)).toBe(read('nested-uls.md'));
    });

    it('nested ols and uls', () => {
        const turnish = new Turnish();
        const input = read('nested-ols-and-uls.html');
        expect(turnish.render(input)).toBe(read('nested-ols-and-uls.md'));
    });

    it('ul with blockquote', () => {
        const turnish = new Turnish();
        const input = "<ul>\n      <li>\n        <p>A list item with a blockquote:</p>\n        <blockquote>\n          <p>This is a blockquote inside a list item.</p>\n        </blockquote>\n      </li>\n    </ul>";
        expect(turnish.render(input)).toBe("- A list item with a blockquote:\n    \n    > This is a blockquote inside a list item.");
    });

    it('blockquote', () => {
        const turnish = new Turnish();
        const input = "<blockquote>\n      <p>This is a paragraph within a blockquote.</p>\n      <p>This is another paragraph within a blockquote.</p>\n    </blockquote>";
        expect(turnish.render(input)).toBe("> This is a paragraph within a blockquote.\n> \n> This is another paragraph within a blockquote.");
    });

    it('nested blockquotes', () => {
        const turnish = new Turnish();
        const input = "<blockquote>\n      <p>This is the first level of quoting.</p>\n      <blockquote>\n        <p>This is a paragraph in a nested blockquote.</p>\n      </blockquote>\n      <p>Back to the first level.</p>\n    </blockquote>";
        expect(turnish.render(input)).toBe("> This is the first level of quoting.\n> \n> > This is a paragraph in a nested blockquote.\n> \n> Back to the first level.");
    });

    it('html in blockquote', () => {
        const turnish = new Turnish();
        const input = read('html-in-blockquote.html');
        expect(turnish.render(input)).toBe(read('html-in-blockquote.md'));
    });

    it('multiple divs', () => {
        const turnish = new Turnish();
        const input = "<div>A div</div><div>Another div</div>";
        expect(turnish.render(input)).toBe("A div\n\nAnother div");
    });

    it('comment', () => {
        const turnish = new Turnish();
        const input = "<!-- comment -->";
        expect(turnish.render(input)).toBe("");
    });

    it('pre/code with comment', () => {
        const turnish = new Turnish();
        const input = "<pre ><code>Hello<!-- comment --> world</code></pre>";
        expect(turnish.render(input)).toBe("```\nHello world\n```");
    });

    it('leading whitespace in heading', () => {
        const turnish = new Turnish();
        const input = "<h3>\n    h3 with leading whitespace</h3>";
        expect(turnish.render(input)).toBe("### h3 with leading whitespace");
    });

    it('trailing whitespace in li', () => {
        const turnish = new Turnish();
        const input = "<ol>\n      <li>Chapter One\n        <ol>\n          <li>Section One</li>\n          <li>Section Two with trailing whitespace </li>\n          <li>Section Three with trailing whitespace </li>\n        </ol>\n      </li>\n      <li>Chapter Two</li>\n      <li>Chapter Three with trailing whitespace  </li>\n    </ol>";
        expect(turnish.render(input)).toBe("1. Chapter One\n    1. Section One\n    2. Section Two with trailing whitespace\n    3. Section Three with trailing whitespace\n2. Chapter Two\n3. Chapter Three with trailing whitespace");
    });

    it('multilined and bizarre formatting', () => {
        const turnish = new Turnish();
        const input = "<ul>\n      <li>\n        Indented li with leading/trailing newlines\n      </li>\n      <li>\n        <strong>Strong with trailing space inside li with leading/trailing whitespace </strong> </li>\n      <li>li without whitespace</li>\n      <li> Leading space, text, lots of whitespace …\n                          text\n      </li>\n    </ol>";
        expect(turnish.render(input)).toBe("- Indented li with leading/trailing newlines\n- **Strong with trailing space inside li with leading/trailing whitespace**\n- li without whitespace\n- Leading space, text, lots of whitespace … text");
    });

    it('whitespace between inline elements', () => {
        const turnish = new Turnish();
        const input = "<p>I <a href=\"http://example.com/need\">need</a> <a href=\"http://www.example.com/more\">more</a> spaces!</p>";
        expect(turnish.render(input)).toBe("I [need](http://example.com/need) [more](http://www.example.com/more) spaces!");
    });

    it('whitespace in inline elements', () => {
        const turnish = new Turnish();
        const input = "Text with no space after the period.<em> Text in em with leading/trailing spaces </em><strong>text in strong with trailing space </strong>";
        expect(turnish.render(input)).toBe("Text with no space after the period. *Text in em with leading/trailing spaces* **text in strong with trailing space**");
    });

    it('whitespace in nested inline elements', () => {
        const turnish = new Turnish();
        const input = "Text at root <strong><a href=\"http://www.example.com\">link text with trailing space in strong </a></strong>more text at root";
        expect(turnish.render(input)).toBe("Text at root **[link text with trailing space in strong](http://www.example.com)** more text at root");
    });

    it('blank inline elements', () => {
        const turnish = new Turnish();
        const input = "Text before blank em … <em></em> text after blank em";
        expect(turnish.render(input)).toBe("Text before blank em … text after blank em");
    });

    it('blank block elements', () => {
        const turnish = new Turnish();
        const input = "Text before blank div … <div></div> text after blank div";
        expect(turnish.render(input)).toBe("Text before blank div …\n\ntext after blank div");
    });

    it('blank inline element with br', () => {
        const turnish = new Turnish();
        const input = "<strong><br></strong>";
        expect(turnish.render(input)).toBe("");
    });

    it('whitespace between blocks', () => {
        const turnish = new Turnish();
        const input = "<div><div>Content in a nested div</div></div>\n<div>Content in another div</div>";
        expect(turnish.render(input)).toBe("Content in a nested div\n\nContent in another div");
    });

    it('escaping backslashes', () => {
        const turnish = new Turnish();
        const input = "backslash \\";
        expect(turnish.render(input)).toBe("backslash \\\\");
    });

    it('escaping headings with #', () => {
        const turnish = new Turnish();
        const input = "### This is not a heading";
        expect(turnish.render(input)).toBe("\\### This is not a heading");
    });

    it('not escaping # outside of a heading', () => {
        const turnish = new Turnish();
        const input = "#This is not # a heading";
        expect(turnish.render(input)).toBe("#This is not # a heading");
    });

    it('escaping em markdown with *', () => {
        const turnish = new Turnish();
        const input = "To add emphasis, surround text with *. For example: *this is emphasis*";
        expect(turnish.render(input)).toBe("To add emphasis, surround text with \\*. For example: \\*this is emphasis\\*");
    });

    it('escaping em markdown with _', () => {
        const turnish = new Turnish();
        const input = "To add emphasis, surround text with _. For example: _this is emphasis_";
        expect(turnish.render(input)).toBe("To add emphasis, surround text with \\_. For example: \\_this is emphasis\\_");
    });

    it('escapes < and > if < and > are not part of a tag', () => {
        const turnish = new Turnish();
        expect.soft(turnish.render("&lt;malicious&gt;")).toBe("\\<malicious\\>");
        expect.soft(turnish.render("&lt;not a tag&gt;")).toBe("\\<not a tag\\>");
        expect.soft(turnish.render("<p>&lt;tag-in-p&gt;</p>")).toBe("\\<tag-in-p\\>");
    });

    it('should not escape < and > in pre/code', () => {
        const turnish = new Turnish();
        expect(turnish.render("<pre><code>&lt;malicious&gt;</code></pre>")).toBe("```\n<malicious>\n```");
    });

    it('escapes < and > within a list item', () => {
        const turnish = new Turnish();
        expect(turnish.render("<ul><li>This is bad > &lt;malicious&gt; < This is bad</li></ul>"))
            .toBe("- This is bad > \\<malicious\\> < This is bad");
    });

    it('not escaping within code', () => {
        const turnish = new Turnish();
        const input = "<pre><code>def this_is_a_method; end;</code></pre>";
        expect(turnish.render(input)).toBe("```\ndef this_is_a_method; end;\n```");
    });

    it('escaping strong markdown with *', () => {
        const turnish = new Turnish();
        const input = "To add strong emphasis, surround text with **. For example: **this is strong**";
        expect(turnish.render(input)).toBe("To add strong emphasis, surround text with \\*\\*. For example: \\*\\*this is strong\\*\\*");
    });

    it('escaping strong markdown with _', () => {
        const turnish = new Turnish();
        const input = "To add strong emphasis, surround text with __. For example: __this is strong__";
        expect(turnish.render(input)).toBe("To add strong emphasis, surround text with \\_\\_. For example: \\_\\_this is strong\\_\\_");
    });

    it('escaping hr markdown with *', () => {
        const turnish = new Turnish();
        const input = "* * *";
        expect(turnish.render(input)).toBe("\\* \\* \\*");
    });

    it('escaping hr markdown with -', () => {
        const turnish = new Turnish();
        const input = "- - -";
        expect(turnish.render(input)).toBe("\\- - -");
    });

    it('escaping hr markdown with _', () => {
        const turnish = new Turnish();
        const input = "_ _ _";
        expect(turnish.render(input)).toBe("\\_ \\_ \\_");
    });

    it('escaping hr markdown without spaces', () => {
        const turnish = new Turnish();
        const input = "***";
        expect(turnish.render(input)).toBe("\\*\\*\\*");
    });

    it('escaping hr markdown with more than 3 characters', () => {
        const turnish = new Turnish();
        const input = "* * * * *";
        expect(turnish.render(input)).toBe("\\* \\* \\* \\* \\*");
    });

    it('escaping ol markdown', () => {
        const turnish = new Turnish();
        const input = "1984. by George Orwell";
        expect(turnish.render(input)).toBe("1984\\. by George Orwell");
    });

    it('not escaping . outside of an ol', () => {
        const turnish = new Turnish();
        const input = "1984.George Orwell wrote 1984.";
        expect(turnish.render(input)).toBe("1984.George Orwell wrote 1984.");
    });

    it('escaping ul markdown *', () => {
        const turnish = new Turnish();
        const input = "* An unordered list item";
        expect(turnish.render(input)).toBe("\\* An unordered list item");
    });

    it('escaping ul markdown -', () => {
        const turnish = new Turnish();
        const input = "- An unordered list item";
        expect(turnish.render(input)).toBe("\\- An unordered list item");
    });

    it('escaping ul markdown +', () => {
        const turnish = new Turnish();
        const input = "+ An unordered list item";
        expect(turnish.render(input)).toBe("\\+ An unordered list item");
    });

    it('not escaping - outside of a ul', () => {
        const turnish = new Turnish();
        const input = "Hello-world, 45 - 3 is 42";
        expect(turnish.render(input)).toBe("Hello-world, 45 - 3 is 42");
    });

    it('not escaping + outside of a ul', () => {
        const turnish = new Turnish();
        const input = "+1 and another +";
        expect(turnish.render(input)).toBe("+1 and another +");
    });

    it('escaping *', () => {
        const turnish = new Turnish();
        const input = "You can use * for multiplication";
        expect(turnish.render(input)).toBe("You can use \\* for multiplication");
    });

    it('escaping ** inside strong tags', () => {
        const turnish = new Turnish();
        const input = "<strong>**test</strong>";
        expect(turnish.render(input)).toBe("**\\*\\*test**");
    });

    it('escaping _ inside em tags', () => {
        const turnish = new Turnish();
        const input = "<em>test_italics</em>";
        expect(turnish.render(input)).toBe("*test\\_italics*");
    });

    it('unnamed case', () => {
        const turnish = new Turnish();
        const input = "> Blockquote in markdown";
        expect(turnish.render(input)).toBe("\\> Blockquote in markdown");
    });

    it('unnamed case', () => {
        const turnish = new Turnish();
        const input = ">Blockquote in markdown";
        expect(turnish.render(input)).toBe("\\>Blockquote in markdown");
    });

    it('unnamed case', () => {
        const turnish = new Turnish();
        const input = "42 > 1";
        expect(turnish.render(input)).toBe("42 > 1");
    });

    it('escaping code', () => {
        const turnish = new Turnish();
        const input = "`not code`";
        expect(turnish.render(input)).toBe("\\`not code\\`");
    });

    it('escaping []', () => {
        const turnish = new Turnish();
        const input = "[This] is a sentence with brackets";
        expect(turnish.render(input)).toBe("\\[This\\] is a sentence with brackets");
    });

    it('escaping [', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://www.example.com\">c[iao</a>";
        expect(turnish.render(input)).toBe("[c\\[iao](http://www.example.com)");
    });

    it('escaping * performance', () => {
        const turnish = new Turnish();
        const input = "fasdf *883 asdf wer qweasd fsd asdf asdfaqwe rqwefrsdf";
        expect(turnish.render(input)).toBe("fasdf \\*883 asdf wer qweasd fsd asdf asdfaqwe rqwefrsdf");
    });

    it('escaping multiple asterisks', () => {
        const turnish = new Turnish();
        const input = "<p>* * ** It aims to be*</p>";
        expect(turnish.render(input)).toBe("\\* \\* \\*\\* It aims to be\\*");
    });

    it('escaping delimiters around short words and numbers', () => {
        const turnish = new Turnish();
        const input = "<p>_Really_? Is that what it _is_? A **2000** year-old computer?</p>";
        expect(turnish.render(input)).toBe("\\_Really\\_? Is that what it \\_is\\_? A \\*\\*2000\\*\\* year-old computer?");
    });

    it('non-markdown block elements', () => {
        const turnish = new Turnish();
        const input = "Foo\n<div>Bar</div>\nBaz";
        expect(turnish.render(input)).toBe("Foo\n\nBar\n\nBaz");
    });

    it('non-markdown inline elements', () => {
        const turnish = new Turnish();
        const input = "Foo <span>Bar</span>";
        expect(turnish.render(input)).toBe("Foo Bar");
    });

    it('blank inline elements', () => {
        const turnish = new Turnish();
        const input = "Hello <em></em>world";
        expect(turnish.render(input)).toBe("Hello world");
    });

    it('elements with a single void element', () => {
        const turnish = new Turnish();
        const input = "<p><img src=\"http://example.com/logo.png\" /></p>";
        expect(turnish.render(input)).toBe("![](http://example.com/logo.png)");
    });

    it('elements with a nested void element', () => {
        const turnish = new Turnish();
        const input = "<p><span><img src=\"http://example.com/logo.png\" /></span></p>";
        expect(turnish.render(input)).toBe("![](http://example.com/logo.png)");
    });

    it('text separated by a space in an element', () => {
        const turnish = new Turnish();
        const input = "<p>Foo<span> </span>Bar</p>";
        expect(turnish.render(input)).toBe("Foo Bar");
    });

    it('text separated by a non-breaking space in an element', () => {
        const turnish = new Turnish();
        const input = `<p>Foo<span>${noBreakSpace}</span>Bar</p>`;
        expect(turnish.render(input)).toBe(`Foo${noBreakSpace}Bar`);
    });

    it('triple tildes inside code', () => {
        const turnish = new Turnish({ codeBlockStyle: "fenced", fence: "~~~" });
        const input = "<pre><code>~~~\nCode\n~~~\n</code></pre>";
        expect(turnish.render(input)).toBe("~~~~\n~~~\nCode\n~~~\n~~~~");
    });

    it('triple ticks inside code', () => {
        const turnish = new Turnish({ codeBlockStyle: "fenced", fence: "```" });
        const input = "<pre><code>```\nCode\n```\n</code></pre>";
        expect(turnish.render(input)).toBe("````\n```\nCode\n```\n````");
    });

    it('four ticks inside code', () => {
        const turnish = new Turnish({ codeBlockStyle: "fenced", fence: "```" });
        const input = "<pre><code>````\nCode\n````\n</code></pre>";
        expect(turnish.render(input)).toBe("`````\n````\nCode\n````\n`````");
    });

    it('empty line in start/end of code block', () => {
        const turnish = new Turnish({ codeBlockStyle: "fenced", fence: "```" });
        const input = "<pre><code>\nCode\n\n</code></pre>";
        expect(turnish.render(input)).toBe("```\n\nCode\n\n```");
    });

    it('text separated by ASCII and nonASCII space in an element', () => {
        const turnish = new Turnish();
        const input = `<p>Foo<span>  ${noBreakSpace}  </span>Bar</p>`;
        expect(turnish.render(input)).toBe(`Foo ${noBreakSpace} Bar`);
    });

    it('list-like text with non-breaking spaces', () => {
        const turnish = new Turnish();
        const input = `${noBreakSpace}1. First<br>${noBreakSpace}2. Second`;
        expect(turnish.render(input)).toBe(`${noBreakSpace}1. First  \n${noBreakSpace}2. Second`);
    });

    it('element with trailing nonASCII WS followed by nonWS', () => {
        const turnish = new Turnish();
        const input = `<i>foo${noBreakSpace}</i>bar`;
        expect(turnish.render(input)).toBe(`*foo*${noBreakSpace}bar`);
    });

    it('element with trailing nonASCII WS followed by nonASCII WS', () => {
        const turnish = new Turnish();
        const input = `<i>foo${noBreakSpace}</i>${noBreakSpace}bar`;
        expect(turnish.render(input)).toBe(`*foo*${noBreakSpace}${noBreakSpace}bar`);
    });

    it('element with trailing ASCII WS followed by nonASCII WS', () => {
        const turnish = new Turnish();
        const input = `<i>foo </i>${noBreakSpace}bar`;
        expect(turnish.render(input)).toBe(`*foo* ${noBreakSpace}bar`);
    });

    it('element with trailing nonASCII WS followed by ASCII WS', () => {
        const turnish = new Turnish();
        const input = `<i>foo${noBreakSpace}</i> bar`;
        expect(turnish.render(input)).toBe(`*foo*${noBreakSpace} bar`);
    });

    it('nonWS followed by element with leading nonASCII WS', () => {
        const turnish = new Turnish();
        const input = `foo<i>${noBreakSpace}bar</i>`;
        expect(turnish.render(input)).toBe(`foo${noBreakSpace}*bar*`);
    });

    it('nonASCII WS followed by element with leading nonASCII WS', () => {
        const turnish = new Turnish();
        const input = `foo${noBreakSpace}<i>${noBreakSpace}bar</i>`;
        expect(turnish.render(input)).toBe(`foo${noBreakSpace}${noBreakSpace}*bar*`);
    });

    it('nonASCII WS followed by element with leading ASCII WS', () => {
        const turnish = new Turnish();
        const input = `foo${noBreakSpace}<i> bar</i>`;
        expect(turnish.render(input)).toBe(`foo${noBreakSpace} *bar*`);
    });

    it('ASCII WS followed by element with leading nonASCII WS', () => {
        const turnish = new Turnish();
        const input = `foo <i>${noBreakSpace}bar</i>`;
        expect(turnish.render(input)).toBe(`foo ${noBreakSpace}*bar*`);
    });

    it('preformatted code with leading whitespace', () => {
        const turnish = new Turnish({ preformattedCode: true });
        const input = "Four spaces <code>    make an indented code block in Markdown</code>";
        expect(turnish.render(input)).toBe("Four spaces `    make an indented code block in Markdown`");
    });

    it('preformatted code with trailing whitespace', () => {
        const turnish = new Turnish({ preformattedCode: true });
        const input = "<code>A line break  </code> <b> note the spaces</b>";
        expect(turnish.render(input)).toBe("`A line break  ` **note the spaces**");
    });

    it('preformatted code tightly surrounded', () => {
        const turnish = new Turnish({ preformattedCode: true });
        const input = "<b>tight</b><code>code</code><b>wrap</b>";
        expect(turnish.render(input)).toBe("**tight**`code`**wrap**");
    });

    it('preformatted code loosely surrounded', () => {
        const turnish = new Turnish({ preformattedCode: true });
        const input = "<b>not so tight </b><code>code</code><b> wrap</b>";
        expect(turnish.render(input)).toBe("**not so tight** `code` **wrap**");
    });

    it('preformatted code with newlines', () => {
        const turnish = new Turnish({ preformattedCode: true });
        const input = "<code>\n\n nasty\ncode\n\n</code>";
        expect(turnish.render(input)).toBe("`    nasty code   `");
    });

    it('parses highlight.js style code block', () => {
        const turnish = new Turnish();
        const input = read('highlight-js.html');
        const expected = read('highlight-js.md');
        expect(turnish.render(input)).toBe(expected);
    });

    it('parses image with multiline alt text', () => {
        const turnish = new Turnish();
        const input = "<img src=\"http://example.com/image.png\" alt=\"This is an image\nwith multiline\nalt text.\" />";
        expect(turnish.render(input)).toBe(`![This is an image with multiline alt text.](http://example.com/image.png)`);
    });

    it('parses link with multiline title text', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com/image.png\" title=\"This is an image\nwith multiline\ntitle text.\">This is an image with multiline title text.</a>";
        expect(turnish.render(input)).toBe(`[This is an image with multiline title text.](http://example.com/image.png "This is an image with multiline title text.")`);
    });

    it('parses link with long-whitespace-including title text', () => {
        const turnish = new Turnish();
        const input = "<a href=\"http://example.com/image.png\" title=\"Hello    World\">This is an image with long-whitespace-including title text.</a>";
        expect(turnish.render(input)).toBe(`[This is an image with long-whitespace-including title text.](http://example.com/image.png "Hello    World")`);
    });

    it('parses strong text with leading and trailing whitespace', () => {
        const turnish = new Turnish();
        expect(turnish.render("<strong><br>Strong Text<br></strong>"))
            .toBe(`**Strong Text**`);
    });

    it('converts standard elements to markdown when htmlRetentionMode is false', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'standard' });
        const input = '<em>Hello</em>';
        expect(turnish.render(input)).toBe('*Hello*');
    });

    it('converts standard elements to markdown when htmlRetentionMode is true', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<em>Hello</em>';
        expect(turnish.render(input)).toBe('*Hello*');
    });

    it('preserves span with id attribute', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<span id="foo">Hello</span>';
        expect(turnish.render(input)).toBe('<span id="foo">Hello</span>');
    });

    it('preserves div with data attribute', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<div data-role="note">Hello</div>';
        expect(turnish.render(input)).toBe('<div data-role="note">Hello</div>');
    });

    it('preserves custom elements', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<custom-element>Hello</custom-element>';
        expect(turnish.render(input)).toBe('<custom-element>Hello</custom-element>');
    });

    it('preserves element with class attribute', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<span class="highlight">Important</span>';
        expect(turnish.render(input)).toBe('<span class="highlight">Important</span>');
    });

    it('preserves element with style attribute', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<span style="color: red;">Red text</span>';
        expect(turnish.render(input)).toBe('<span style="color: red;">Red text</span>');
    });

    it('does not preserve span without attributes when preserveUnsupported is false', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'standard' });
        const input = '<span id="foo">Hello</span>';
        expect(turnish.render(input)).toBe('Hello');
    });

    it('preserves link with data attribute', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<a href="http://example.com" data-track="click">Link</a>';
        expect(turnish.render(input)).toBe('<a href="http://example.com" data-track="click">Link</a>');
    });

    it('converts link without extra attributes normally', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<a href="http://example.com">Link</a>';
        expect(turnish.render(input)).toBe('[Link](http://example.com)');
    });

    it('converts link with title normally', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<a href="http://example.com" title="Title">Link</a>';
        expect(turnish.render(input)).toBe('[Link](http://example.com "Title")');
    });

    it('preserves image with extra attributes', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<img src="image.png" alt="Alt" width="100">';
        expect(turnish.render(input)).toBe('<img src="image.png" alt="Alt" width="100">');
    });

    it('converts image without extra attributes normally', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<img src="image.png" alt="Alt">';
        expect(turnish.render(input)).toBe('![Alt](image.png)');
    });

    it('converts image with title normally', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<img src="image.png" alt="Alt" title="Title">';
        expect(turnish.render(input)).toBe('![Alt](image.png "Title")');
    });

    it('preserves code block with extra attributes', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<pre><code data-lang="javascript">const x = 1;</code></pre>';
        expect(turnish.render(input)).toBe('<pre><code data-lang="javascript">const x = 1;</code></pre>');
    });

    it('converts code block with class attribute normally', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<pre><code class="language-javascript">const x = 1;</code></pre>';
        expect(turnish.render(input)).toBe('```javascript\nconst x = 1;\n```');
    });

    it('preserves mixed content with standard and unsupported elements', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<p><em>Hello</em> <span id="foo">world</span></p>';
        expect(turnish.render(input)).toBe('*Hello* <span id="foo">world</span>');
    });

    it('preserves nested unsupported elements', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<custom-outer><custom-inner>Hello</custom-inner></custom-outer>';
        expect(turnish.render(input)).toBe('<custom-outer><custom-inner>Hello</custom-inner></custom-outer>');
    });

    it('preserves web component style elements', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<my-component attr="value">Content</my-component>';
        expect(turnish.render(input)).toBe('<my-component attr="value">Content</my-component>');
    });

    it('preserves element with multiple attributes', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'preserveAll' });
        const input = '<div class="foo" id="bar" data-value="baz">Content</div>';
        expect(turnish.render(input)).toBe('<div class="foo" id="bar" data-value="baz">Content</div>');
    });

    it('markdownIncludingHtml: preserves div with id and converts inner bold to markdown', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<div id="preserve-me"><b>some bolded text</b></div>';
        expect(turnish.render(input)).toBe('<div id="preserve-me" markdown="1">\n**some bolded text**\n</div>');
    });

    it('markdownIncludingHtml: preserves custom element and converts inner content', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<custom-element><em>italic text</em> and <strong>bold text</strong></custom-element>';
        expect(turnish.render(input)).toBe('<custom-element markdown="1">\n*italic text* and **bold text**\n</custom-element>');
    });

    it('markdownIncludingHtml: preserves element with class attribute and converts inner content', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<div class="note"><p>A paragraph</p></div>';
        expect(turnish.render(input)).toBe('<div class="note" markdown="1">\nA paragraph\n</div>');
    });

    it('markdownIncludingHtml: preserves element with multiple attributes and converts inner content', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<div class="foo" id="bar" data-value="baz"><strong>Bold content</strong></div>';
        expect(turnish.render(input)).toBe('<div class="foo" id="bar" data-value="baz" markdown="1">\n**Bold content**\n</div>');
    });

    it('markdownIncludingHtml: preserves span with id and converts inner content', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<span id="note"><em>Important</em></span>';
        expect(turnish.render(input)).toBe('<span id="note" markdown="1">\n*Important*\n</span>');
    });

    it('markdownIncludingHtml: converts standard elements normally', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<p><em>Hello</em> <strong>world</strong></p>';
        expect(turnish.render(input)).toBe('*Hello* **world**');
    });

    it('markdownIncludingHtml: preserves nested custom elements and converts inner standard elements', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<custom-outer><custom-inner><b>Bold</b></custom-inner></custom-outer>';
        expect(turnish.render(input)).toBe('<custom-outer markdown="1">\n<custom-inner markdown="1">\n**Bold**\n</custom-inner>\n</custom-outer>');
    });

    it('markdownIncludingHtml: preserves element with data attributes and converts lists', () => {
        const turnish = new Turnish({ htmlRetentionMode: 'markdownIncludingHtml' });
        const input = '<div data-component="list"><ul><li>Item 1</li><li>Item 2</li></ul></div>';
        expect(turnish.render(input)).toBe('<div data-component="list" markdown="1">\n- Item 1\n- Item 2\n</div>');
    });

    it('listItemIndent with tab', () => {
        const turnish = new Turnish({ listItemIndent: 'tab' });
        const input = "<ul>\n      <li>\n        <p>List item with paragraph</p>\n        <p>Second paragraph</p>\n      </li>\n    </ul>";
        expect(turnish.render(input)).toBe("- List item with paragraph\n\t\n\tSecond paragraph");
    });

    it('listItemIndent with space and listItemIndentSpaceCount 2', () => {
        const turnish = new Turnish({ listItemIndent: 'space', listItemIndentSpaceCount: 2 });
        const input = "<ul>\n      <li>\n        <p>List item with paragraph</p>\n        <p>Second paragraph</p>\n      </li>\n    </ul>";
        expect(turnish.render(input)).toBe("- List item with paragraph\n  \n  Second paragraph");
    });

    it('nested lists with listItemIndentSpaceCount 2', () => {
        const turnish = new Turnish({ listItemIndentSpaceCount: 2 });
        const input = "<ul>\n      <li>Root item</li>\n      <li>\n        <ul>\n          <li>Nested item</li>\n        </ul>\n      </li>\n    </ul>";
        expect(turnish.render(input)).toBe("- Root item\n  - Nested item");
    });

    it('nested lists with tab indentation', () => {
        const turnish = new Turnish({ listItemIndent: 'tab' });
        const input = "<ul>\n      <li>Root item</li>\n      <li>\n        <ul>\n          <li>Nested item 1</li>\n          <li>Nested item 2</li>\n        </ul>\n      </li>\n    </ul>";
        expect(turnish.render(input)).toBe("- Root item\n\t- Nested item 1\n\t- Nested item 2");
    });

    it('ignores listItemIndentSpaceCount if listItemIndent is tab', () => {
        const turnish = new Turnish({ listItemIndent: 'tab', listItemIndentSpaceCount: 2 });
        const input = "<ul>\n      <li>Root item</li>\n      <li>\n        <ul>\n          <li>Nested item</li>\n        </ul>\n      </li>\n    </ul>";
        expect(turnish.render(input)).toBe("- Root item\n\t- Nested item");
    });

    it('controls number of spaces after bullet list item markers', () => {
        const turnish = new Turnish({ listMarkerSpaceCount: 4 });
        const input = "<ul>\n      <li>Item 1</li>\n      <li>Item 2</li>\n    </ul>";
        expect(turnish.render(input)).toBe("-    Item 1\n-    Item 2");
    });

    it('controls number of spaces after ordered item markers', () => {
        const turnish = new Turnish({ listMarkerSpaceCount: 4 });
        const input = "<ol>\n      <li>Item 1</li>\n      <li>Item 2</li>\n    </ol>";
        expect(turnish.render(input)).toBe("1.    Item 1\n2.    Item 2");
    });
});
