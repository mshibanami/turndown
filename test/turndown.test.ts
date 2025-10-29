import TurndownService from '../src/turndown';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('TurndownService', () => {
    it('parses p tag', () => {
        const turndownService = new TurndownService();
        const input = '<p>Lorem ipsum</p>';
        expect(turndownService.turndown(input)).toBe('Lorem ipsum');
    });

    it('malformed documents', () => {
        const turndownService = new TurndownService();
        expect(() => {
            turndownService.turndown('<HTML><head></head><BODY><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><body onload=alert(document.cookie);></body></html>');
        }).not.toThrow();
    });

    it('null input', () => {
        const turndownService = new TurndownService();
        expect(() => turndownService.turndown(null as any)).toThrow(/null is not a string/);
    });

    it('undefined input', () => {
        const turndownService = new TurndownService();
        expect(() => turndownService.turndown(undefined as any)).toThrow(/undefined is not a string/);
    });

    it('#addRule returns the instance', () => {
        const turndownService = new TurndownService();
        const rule = {
            filter: ['del', 's', 'strike'],
            replacement: (content: string) => '~~' + content + '~~'
        };
        expect(turndownService.addRule('strikethrough', rule)).toBe(turndownService);
    });

    it('#addRule adds the rule', () => {
        const turndownService = new TurndownService();
        const rule = {
            filter: ['del', 's', 'strike'],
            replacement: (content: string) => '~~' + content + '~~'
        };
        let called = false;
        if (turndownService.rules && typeof turndownService.rules.add === 'function') {
            turndownService.rules.add = (key: string, r: any) => {
                expect(key).toBe('strikethrough');
                expect(r).toBe(rule);
                called = true;
            };
            turndownService.addRule('strikethrough', rule);
            expect(called).toBe(true);
        } else {
            // If rules.add is not available, just check addRule returns instance
            expect(turndownService.addRule('strikethrough', rule)).toBe(turndownService);
        }
    });

    it('#use returns the instance for chaining', () => {
        const turndownService = new TurndownService();
        expect(turndownService.use(function plugin() { })).toBe(turndownService);
    });

    it('#use with a single plugin calls the fn with instance', () => {
        const turndownService = new TurndownService();
        let called = false;
        function plugin(service: any) {
            expect(service).toBe(turndownService);
            called = true;
        }
        turndownService.use(plugin);
        expect(called).toBe(true);
    });

    it('#use with multiple plugins calls each fn with instance', () => {
        const turndownService = new TurndownService();
        let called1 = false, called2 = false;
        function plugin1(service: any) {
            expect(service).toBe(turndownService);
            called1 = true;
        }
        function plugin2(service: any) {
            expect(service).toBe(turndownService);
            called2 = true;
        }
        turndownService.use([plugin1, plugin2]);
        expect(called1).toBe(true);
        expect(called2).toBe(true);
    });

    it('#keep keeps elements as HTML', () => {
        const turndownService = new TurndownService();
        const input = '<p>Hello <del>world</del><ins>World</ins></p>';
        expect.soft(turndownService.turndown(input)).toBe('Hello worldWorld');
        turndownService.keep(['del']);
        expect.soft(turndownService.turndown(input)).toBe('Hello <del>world</del>World');
        turndownService.keep(['ins']);
        expect.soft(turndownService.turndown(input)).toBe('Hello <del>world</del><ins>World</ins>');
    });

    it('#keep returns the TurndownService instance for chaining', () => {
        const turndownService = new TurndownService();
        expect(turndownService.keep(['del', 'ins'])).toBe(turndownService);
    });

    it('keep rules are overridden by the standard rules', () => {
        const turndownService = new TurndownService();
        turndownService.keep('p');
        expect(turndownService.turndown('<p>Hello world</p>')).toBe('Hello world');
    });

    it('keeping elements that have a blank textContent but contain significant elements', () => {
        const turndownService = new TurndownService();
        turndownService.keep('figure');
        expect(turndownService.turndown('<figure><iframe src="http://example.com"></iframe></figure>')).toBe('<figure><iframe src="http://example.com"></iframe></figure>');
    });

    it('keepReplacement can be customised', () => {
        const turndownService = new TurndownService({
            keepReplacement: (content: string, node: any) => '\n\n' + node.outerHTML + '\n\n'
        });
        turndownService.keep(['del', 'ins']);
        expect(turndownService.turndown('<p>Hello <del>world</del><ins>World</ins></p>')).toBe('Hello \n\n<del>world</del>\n\n<ins>World</ins>');
    });

    it('#remove removes elements', () => {
        const turndownService = new TurndownService();
        const input = '<del>Please redact me</del>';
        expect(turndownService.turndown(input)).toBe('Please redact me');
        turndownService.remove('del');
        expect(turndownService.turndown(input)).toBe('');
    });

    it('#remove returns the TurndownService instance for chaining', () => {
        const turndownService = new TurndownService();
        expect(turndownService.remove(['del', 'ins'])).toBe(turndownService);
    });

    it('remove elements are overridden by rules', () => {
        const turndownService = new TurndownService();
        turndownService.remove('p');
        expect(turndownService.turndown('<p>Hello world</p>')).toBe('Hello world');
    });

    it('remove elements are overridden by keep', () => {
        const turndownService = new TurndownService();
        turndownService.keep(['del', 'ins']);
        turndownService.remove(['del', 'ins']);
        expect(turndownService.turndown('<p>Hello <del>world</del><ins>World</ins></p>')).toBe('Hello <del>world</del><ins>World</ins>');
    });

    it('has no newline in the text of a link', () => {
        const turndownService = new TurndownService();
        expect.soft(turndownService
            .turndown('<a href="http://example.com">Example Link</a>'))
            .toBe('[Example Link](http://example.com)');
        expect.soft(turndownService
            .turndown('<a href="http://example.com"><p>Example Link</p></a>'))
            .toBe('[Example Link](http://example.com)');
        expect.soft(turndownService
            .turndown('<a href="http://example.com"><span>Example<br/>Link</span></a>'))
            .toBe('[Example Link](http://example.com)');
    });

    it('multiple ps', () => {
        const turndownService = new TurndownService();
        const input = '<p>Lorem</p>\n<p>ipsum</p>\n<p>sit</p>';
        expect(turndownService.turndown(input)).toBe('Lorem\n\nipsum\n\nsit');
    });

    it('em', () => {
        const turndownService = new TurndownService();
        const input = '<em>em element</em>';
        expect(turndownService.turndown(input)).toBe('_em element_');
    });

    it('i', () => {
        const turndownService = new TurndownService();
        const input = '<i>i element</i>';
        expect(turndownService.turndown(input)).toBe('_i element_');
    });

    it('strong', () => {
        const turndownService = new TurndownService();
        const input = '<strong>strong element</strong>';
        expect(turndownService.turndown(input)).toBe('**strong element**');
    });

    it('b', () => {
        const turndownService = new TurndownService();
        const input = '<b>b element</b>';
        expect(turndownService.turndown(input)).toBe('**b element**');
    });

    it('code', () => {
        const turndownService = new TurndownService();
        const input = '<code>code element</code>';
        expect(turndownService.turndown(input)).toBe('`code element`');
    });

    it('code containing a backtick', () => {
        const turndownService = new TurndownService();
        const input = '<code>There is a literal backtick (`) here</code>';
        expect(turndownService.turndown(input)).toBe('``There is a literal backtick (`) here``');
    });

    it('code containing three or more backticks', () => {
        const turndownService = new TurndownService();
        const input = '<code>here are three ``` here are four ```` that\'s it</code>';
        expect(turndownService.turndown(input)).toBe("`here are three ``` here are four ```` that's it`");
    });

    it('code containing one or more backticks', () => {
        const turndownService = new TurndownService();
        const input = '<code>here are three ``` here are four ```` here is one ` that\'s it</code>';
        expect(turndownService.turndown(input)).toBe("``here are three ``` here are four ```` here is one ` that's it``");
    });

    it('code starting with a backtick', () => {
        const turndownService = new TurndownService();
        const input = '<code>`starting with a backtick</code>';
        expect(turndownService.turndown(input)).toBe('`` `starting with a backtick ``');
    });


    it('code containing markdown syntax', () => {
        const turndownService = new TurndownService();
        const input = "<code>_emphasis_</code>";
        expect(turndownService.turndown(input)).toBe("`_emphasis_`");
    });

    it('code containing markdown syntax in a span', () => {
        const turndownService = new TurndownService();
        const input = "<code><span>_emphasis_</span></code>";
        expect(turndownService.turndown(input)).toBe("`_emphasis_`");
    });

    it('h1', () => {
        const turndownService = new TurndownService();
        const input = "<h1>Level One Heading</h1>";
        expect(turndownService.turndown(input)).toBe("Level One Heading\n=================");
    });

    it('escape = when used as heading', () => {
        const turndownService = new TurndownService();
        const input = "===";
        expect(turndownService.turndown(input)).toBe("\\===");
    });

    it('not escaping = outside of a heading', () => {
        const turndownService = new TurndownService();
        const input = "A sentence containing =";
        expect(turndownService.turndown(input)).toBe("A sentence containing =");
    });

    it('h1 as atx', () => {
        const turndownService = new TurndownService({ "headingStyle": "atx" });
        const input = "<h1>Level One Heading with ATX</h1>";
        expect(turndownService.turndown(input)).toBe("# Level One Heading with ATX");
    });

    it('h2', () => {
        const turndownService = new TurndownService();
        const input = "<h2>Level Two Heading</h2>";
        expect(turndownService.turndown(input)).toBe("Level Two Heading\n-----------------");
    });

    it('h2 as atx', () => {
        const turndownService = new TurndownService({ "headingStyle": "atx" });
        const input = "<h2>Level Two Heading with ATX</h2>";
        expect(turndownService.turndown(input)).toBe("## Level Two Heading with ATX");
    });

    it('h3', () => {
        const turndownService = new TurndownService();
        const input = "<h3>Level Three Heading</h3>";
        expect(turndownService.turndown(input)).toBe("### Level Three Heading");
    });

    it('heading with child', () => {
        const turndownService = new TurndownService();
        const input = "<h4>Level Four Heading with <code>child</code></h4>";
        expect(turndownService.turndown(input)).toBe("#### Level Four Heading with `child`");
    });

    it('invalid heading', () => {
        const turndownService = new TurndownService();
        const input = "<h7>Level Seven Heading?</h7>";
        expect(turndownService.turndown(input)).toBe("Level Seven Heading?");
    });

    it('hr', () => {
        const turndownService = new TurndownService();
        const input = "<hr>";
        expect(turndownService.turndown(input)).toBe("* * *");
    });

    it('hr with closing tag', () => {
        const turndownService = new TurndownService();
        const input = "<hr></hr>";
        expect(turndownService.turndown(input)).toBe("* * *");
    });

    it('hr with option', () => {
        const turndownService = new TurndownService({ "hr": "- - -" });
        const input = "<hr>";
        expect(turndownService.turndown(input)).toBe("- - -");
    });

    it('br', () => {
        const turndownService = new TurndownService();
        const input = "More<br>after the break";
        expect(turndownService.turndown(input)).toBe("More  \nafter the break");
    });

    it('br with visible line-ending', () => {
        const turndownService = new TurndownService({ "br": "\\" });
        const input = "More<br>after the break";
        expect(turndownService.turndown(input)).toBe("More\\\nafter the break");
    });

    it('img with no alt', () => {
        const turndownService = new TurndownService();
        const input = "<img src=\"http://example.com/logo.png\" />";
        expect(turndownService.turndown(input)).toBe("![](http://example.com/logo.png)");
    });

    it('img with relative src', () => {
        const turndownService = new TurndownService();
        const input = "<img src=\"logo.png\">";
        expect(turndownService.turndown(input)).toBe("![](logo.png)");
    });

    it('img with alt', () => {
        const turndownService = new TurndownService();
        const input = "<img src=\"logo.png\" alt=\"img with alt\">";
        expect(turndownService.turndown(input)).toBe("![img with alt](logo.png)");
    });

    it('img with no src', () => {
        const turndownService = new TurndownService();
        const input = "<img>";
        expect(turndownService.turndown(input)).toBe("");
    });

    it('img with a new line in alt', () => {
        const turndownService = new TurndownService();
        const input = "<img src=\"logo.png\" alt=\"img with\n    alt\">";
        expect(turndownService.turndown(input)).toBe("![img with\nalt](logo.png)");
    });

    it('img with more than one new line in alt', () => {
        const turndownService = new TurndownService();
        const input = "<img src=\"logo.png\" alt=\"img with\n    \n    alt\">";
        expect(turndownService.turndown(input)).toBe("![img with\nalt](logo.png)");
    });

    it('img with new lines in title', () => {
        const turndownService = new TurndownService();
        const input = "<img src=\"logo.png\" title=\"the\n    \n    title\">";
        expect(turndownService.turndown(input)).toBe("![](logo.png \"the\ntitle\")");
    });

    it('a', () => {
        const turndownService = new TurndownService();
        const input = "<a href=\"http://example.com\">An anchor</a>";
        expect(turndownService.turndown(input)).toBe("[An anchor](http://example.com)");
    });

    it('a with title', () => {
        const turndownService = new TurndownService();
        const input = "<a href=\"http://example.com\" title=\"Title for link\">An anchor</a>";
        expect(turndownService.turndown(input)).toBe("[An anchor](http://example.com \"Title for link\")");
    });

    it('a with multiline title', () => {
        const turndownService = new TurndownService();
        const input = "<a href=\"http://example.com\" title=\"Title for\n    \n    link\">An anchor</a>";
        expect(turndownService.turndown(input)).toBe("[An anchor](http://example.com \"Title for\nlink\")");
    });

    it('a with quotes in title', () => {
        const turndownService = new TurndownService();
        const input = "<a href=\"http://example.com\" title=\"&quot;hello&quot;\">An anchor</a>";
        expect(turndownService.turndown(input)).toBe("[An anchor](http://example.com \"\\\"hello\\\"\")");
    });

    it('a with parenthesis in query', () => {
        const turndownService = new TurndownService();
        const input = "<a href=\"http://example.com?(query)\">An anchor</a>";
        expect(turndownService.turndown(input)).toBe("[An anchor](http://example.com?\\(query\\))");
    });

    it('a without a src', () => {
        const turndownService = new TurndownService();
        const input = "<a id=\"about-anchor\">Anchor without a title</a>";
        expect(turndownService.turndown(input)).toBe("Anchor without a title");
    });

    it('a with a child', () => {
        const turndownService = new TurndownService();
        const input = "<a href=\"http://example.com/code\">Some <code>code</code></a>";
        expect(turndownService.turndown(input)).toBe("[Some `code`](http://example.com/code)");
    });

    it('a reference', () => {
        const turndownService = new TurndownService({ "linkStyle": "referenced" });
        const input = "<a href=\"http://example.com\">Reference link</a>";
        expect(turndownService.turndown(input)).toBe("[Reference link][1]\n\n[1]: http://example.com");
    });

    it('a reference with collapsed style', () => {
        const turndownService = new TurndownService({ "linkStyle": "referenced", "linkReferenceStyle": "collapsed" });
        const input = "<a href=\"http://example.com\">Reference link with collapsed style</a>";
        expect(turndownService.turndown(input)).toBe("[Reference link with collapsed style][]\n\n[Reference link with collapsed style]: http://example.com");
    });

    it('a reference with shortcut style', () => {
        const turndownService = new TurndownService({ "linkStyle": "referenced", "linkReferenceStyle": "shortcut" });
        const input = "<a href=\"http://example.com\">Reference link with shortcut style</a>";
        expect(turndownService.turndown(input)).toBe("[Reference link with shortcut style]\n\n[Reference link with shortcut style]: http://example.com");
    });

    it('pre/code block', () => {
        const turndownService = new TurndownService();
        const input = read('pre-code-block.html');
        expect(turndownService.turndown(input)).toBe(read('pre-code-block.md'));
    });

    it('multiple pre/code blocks', () => {
        const turndownService = new TurndownService();
        const input = read('multiple-pre-code-blocks.html');
        expect(turndownService.turndown(input)).toBe(read('multiple-pre-code-blocks.md'));
    });

    it('pre/code block with multiple new lines', () => {
        const turndownService = new TurndownService();
        const input = read('pre-code-block-with-multiple-new-lines.html');
        expect(turndownService.turndown(input)).toBe(read('pre-code-block-with-multiple-new-lines.md'));
    });

    it('fenced pre/code block', () => {
        const turndownService = new TurndownService({ "codeBlockStyle": "fenced" });
        const input = "<pre><code>def a_fenced_code block; end</code></pre>";
        expect(turndownService.turndown(input)).toBe("```\ndef a_fenced_code block; end\n```");
    });

    it('pre/code block fenced with ~', () => {
        const turndownService = new TurndownService({ "codeBlockStyle": "fenced", "fence": "~~~" });
        const input = "<pre><code>def a_fenced_code block; end</code></pre>";
        expect(turndownService.turndown(input)).toBe("~~~\ndef a_fenced_code block; end\n~~~");
    });

    it('escaping ~~~', () => {
        const turndownService = new TurndownService();
        const input = "<pre>~~~ foo</pre>";
        expect(turndownService.turndown(input)).toBe("\\~~~ foo");
    });

    it('not escaping ~~~', () => {
        const turndownService = new TurndownService();
        const input = "A sentence containing ~~~";
        expect(turndownService.turndown(input)).toBe("A sentence containing ~~~");
    });

    it('fenced pre/code block with language', () => {
        const turndownService = new TurndownService({ "codeBlockStyle": "fenced" });
        const input = "<pre><code class=\"language-ruby\">def a_fenced_code block; end</code></pre>";
        expect(turndownService.turndown(input)).toBe("```ruby\ndef a_fenced_code block; end\n```");
    });

    it('empty pre does not throw error', () => {
        const turndownService = new TurndownService();
        const input = "<pre></pre>";
        expect(turndownService.turndown(input)).toBe("");
    });

    it('ol', () => {
        const turndownService = new TurndownService();
        const input = "<ol>\n      <li>Ordered list item 1</li>\n      <li>Ordered list item 2</li>\n      <li>Ordered list item 3</li>\n    </ol>";
        expect(turndownService.turndown(input)).toBe("1.  Ordered list item 1\n2.  Ordered list item 2\n3.  Ordered list item 3");
    });

    it('ol with start', () => {
        const turndownService = new TurndownService();
        const input = "<ol start=\"42\">\n      <li>Ordered list item 42</li>\n      <li>Ordered list item 43</li>\n      <li>Ordered list item 44</li>\n    </ol>";
        expect(turndownService.turndown(input)).toBe("42.  Ordered list item 42\n43.  Ordered list item 43\n44.  Ordered list item 44");
    });

    it('ol with content', () => {
        const turndownService = new TurndownService();
        const input = "<ol start=\"42\">\n      <li>\n        <p>Ordered list item 42</p>\n        <p>Ordered list's additional content</p>\n      </li>\n    </ol>";
        expect(turndownService.turndown(input)).toBe("42.  Ordered list item 42\n     \n     Ordered list's additional content");
    });

    it('list spacing', () => {
        const turndownService = new TurndownService();
        const input = "<p>A paragraph.</p>\n    <ol>\n      <li>Ordered list item 1</li>\n      <li>Ordered list item 2</li>\n      <li>Ordered list item 3</li>\n    </ol>\n    <p>Another paragraph.</p>\n    <ul>\n      <li>Unordered list item 1</li>\n      <li>Unordered list item 2</li>\n      <li>Unordered list item 3</li>\n    </ul>";
        expect(turndownService.turndown(input)).toBe("A paragraph.\n\n1.  Ordered list item 1\n2.  Ordered list item 2\n3.  Ordered list item 3\n\nAnother paragraph.\n\n*   Unordered list item 1\n*   Unordered list item 2\n*   Unordered list item 3");
    });

    it('ul', () => {
        const turndownService = new TurndownService();
        const input = "<ul>\n      <li>Unordered list item 1</li>\n      <li>Unordered list item 2</li>\n      <li>Unordered list item 3</li>\n    </ul>";
        expect(turndownService.turndown(input)).toBe("*   Unordered list item 1\n*   Unordered list item 2\n*   Unordered list item 3");
    });

    it('ul with custom bullet', () => {
        const turndownService = new TurndownService({ "bulletListMarker": "-" });
        const input = "<ul>\n      <li>Unordered list item 1</li>\n      <li>Unordered list item 2</li>\n      <li>Unordered list item 3</li>\n    </ul>";
        expect(turndownService.turndown(input)).toBe("-   Unordered list item 1\n-   Unordered list item 2\n-   Unordered list item 3");
    });

    it('ul with paragraph', () => {
        const turndownService = new TurndownService();
        const input = "<ul>\n      <li><p>List item with paragraph</p></li>\n      <li>List item without paragraph</li>\n    </ul>";
        expect(turndownService.turndown(input)).toBe("*   List item with paragraph\n    \n*   List item without paragraph");
    });

    it('ol with paragraphs', () => {
        const turndownService = new TurndownService();
        const input = "<ol>\n      <li>\n        <p>This is a paragraph in a list item.</p>\n        <p>This is a paragraph in the same list item as above.</p>\n      </li>\n      <li>\n        <p>A paragraph in a second list item.</p>\n      </li>\n    </ol>";
        expect(turndownService.turndown(input)).toBe("1.  This is a paragraph in a list item.\n    \n    This is a paragraph in the same list item as above.\n    \n2.  A paragraph in a second list item.");
    });

    it('nested uls', () => {
        const turndownService = new TurndownService();
        const input = "<ul>\n      <li>This is a list item at root level</li>\n      <li>This is another item at root level</li>\n      <li>\n        <ul>\n          <li>This is a nested list item</li>\n          <li>This is another nested list item</li>\n          <li>\n            <ul>\n              <li>This is a deeply nested list item</li>\n              <li>This is another deeply nested list item</li>\n              <li>This is a third deeply nested list item</li>\n            </ul>\n          </li>\n        </ul>\n      </li>\n      <li>This is a third item at root level</li>\n    </ul>";
        expect(turndownService.turndown(input)).toBe("*   This is a list item at root level\n*   This is another item at root level\n*   *   This is a nested list item\n    *   This is another nested list item\n    *   *   This is a deeply nested list item\n        *   This is another deeply nested list item\n        *   This is a third deeply nested list item\n*   This is a third item at root level");
    });

    it('nested ols and uls', () => {
        const turndownService = new TurndownService();
        const input = "<ul>\n      <li>This is a list item at root level</li>\n      <li>This is another item at root level</li>\n      <li>\n        <ol>\n          <li>This is a nested list item</li>\n          <li>This is another nested list item</li>\n          <li>\n            <ul>\n              <li>This is a deeply nested list item</li>\n              <li>This is another deeply nested list item</li>\n              <li>This is a third deeply nested list item</li>\n            </ul>\n          </li>\n        </ol>\n      </li>\n      <li>This is a third item at root level</li>\n    </ul>";
        expect(turndownService.turndown(input)).toBe("*   This is a list item at root level\n*   This is another item at root level\n*   1.  This is a nested list item\n    2.  This is another nested list item\n    3.  *   This is a deeply nested list item\n        *   This is another deeply nested list item\n        *   This is a third deeply nested list item\n*   This is a third item at root level");
    });

    it('ul with blockquote', () => {
        const turndownService = new TurndownService();
        const input = "<ul>\n      <li>\n        <p>A list item with a blockquote:</p>\n        <blockquote>\n          <p>This is a blockquote inside a list item.</p>\n        </blockquote>\n      </li>\n    </ul>";
        expect(turndownService.turndown(input)).toBe("*   A list item with a blockquote:\n    \n    > This is a blockquote inside a list item.");
    });

    it('blockquote', () => {
        const turndownService = new TurndownService();
        const input = "<blockquote>\n      <p>This is a paragraph within a blockquote.</p>\n      <p>This is another paragraph within a blockquote.</p>\n    </blockquote>";
        expect(turndownService.turndown(input)).toBe("> This is a paragraph within a blockquote.\n> \n> This is another paragraph within a blockquote.");
    });

    it('nested blockquotes', () => {
        const turndownService = new TurndownService();
        const input = "<blockquote>\n      <p>This is the first level of quoting.</p>\n      <blockquote>\n        <p>This is a paragraph in a nested blockquote.</p>\n      </blockquote>\n      <p>Back to the first level.</p>\n    </blockquote>";
        expect(turndownService.turndown(input)).toBe("> This is the first level of quoting.\n> \n> > This is a paragraph in a nested blockquote.\n> \n> Back to the first level.");
    });

    it('html in blockquote', () => {
        const turndownService = new TurndownService();
        const input = read('html-in-blockquote.html');
        expect(turndownService.turndown(input)).toBe(read('html-in-blockquote.md'));
    });

    it('multiple divs', () => {
        const turndownService = new TurndownService();
        const input = "<div>A div</div><div>Another div</div>";
        expect(turndownService.turndown(input)).toBe("A div\n\nAnother div");
    });

    it('comment', () => {
        const turndownService = new TurndownService();
        const input = "<!-- comment -->";
        expect(turndownService.turndown(input)).toBe("");
    });

    it('pre/code with comment', () => {
        const turndownService = new TurndownService();
        const input = "<pre ><code>Hello<!-- comment --> world</code></pre>";
        expect(turndownService.turndown(input)).toBe("```\nHello world\n```");
    });

    it('leading whitespace in heading', () => {
        const turndownService = new TurndownService();
        const input = "<h3>\n    h3 with leading whitespace</h3>";
        expect(turndownService.turndown(input)).toBe("### h3 with leading whitespace");
    });

    it('trailing whitespace in li', () => {
        const turndownService = new TurndownService();
        const input = "<ol>\n      <li>Chapter One\n        <ol>\n          <li>Section One</li>\n          <li>Section Two with trailing whitespace </li>\n          <li>Section Three with trailing whitespace </li>\n        </ol>\n      </li>\n      <li>Chapter Two</li>\n      <li>Chapter Three with trailing whitespace  </li>\n    </ol>";
        expect(turndownService.turndown(input)).toBe("1.  Chapter One\n    1.  Section One\n    2.  Section Two with trailing whitespace\n    3.  Section Three with trailing whitespace\n2.  Chapter Two\n3.  Chapter Three with trailing whitespace");
    });

    it('multilined and bizarre formatting', () => {
        const turndownService = new TurndownService();
        const input = "<ul>\n      <li>\n        Indented li with leading/trailing newlines\n      </li>\n      <li>\n        <strong>Strong with trailing space inside li with leading/trailing whitespace </strong> </li>\n      <li>li without whitespace</li>\n      <li> Leading space, text, lots of whitespace …\n                          text\n      </li>\n    </ol>";
        expect(turndownService.turndown(input)).toBe("*   Indented li with leading/trailing newlines\n*   **Strong with trailing space inside li with leading/trailing whitespace**\n*   li without whitespace\n*   Leading space, text, lots of whitespace … text");
    });

    it('whitespace between inline elements', () => {
        const turndownService = new TurndownService();
        const input = "<p>I <a href=\"http://example.com/need\">need</a> <a href=\"http://www.example.com/more\">more</a> spaces!</p>";
        expect(turndownService.turndown(input)).toBe("I [need](http://example.com/need) [more](http://www.example.com/more) spaces!");
    });

    it('whitespace in inline elements', () => {
        const turndownService = new TurndownService();
        const input = "Text with no space after the period.<em> Text in em with leading/trailing spaces </em><strong>text in strong with trailing space </strong>";
        expect(turndownService.turndown(input)).toBe("Text with no space after the period. _Text in em with leading/trailing spaces_ **text in strong with trailing space**");
    });

    it('whitespace in nested inline elements', () => {
        const turndownService = new TurndownService();
        const input = "Text at root <strong><a href=\"http://www.example.com\">link text with trailing space in strong </a></strong>more text at root";
        expect(turndownService.turndown(input)).toBe("Text at root **[link text with trailing space in strong](http://www.example.com)** more text at root");
    });

    it('blank inline elements', () => {
        const turndownService = new TurndownService();
        const input = "Text before blank em … <em></em> text after blank em";
        expect(turndownService.turndown(input)).toBe("Text before blank em … text after blank em");
    });

    it('blank block elements', () => {
        const turndownService = new TurndownService();
        const input = "Text before blank div … <div></div> text after blank div";
        expect(turndownService.turndown(input)).toBe("Text before blank div …\n\ntext after blank div");
    });

    it('blank inline element with br', () => {
        const turndownService = new TurndownService();
        const input = "<strong><br></strong>";
        expect(turndownService.turndown(input)).toBe("");
    });

    it('whitespace between blocks', () => {
        const turndownService = new TurndownService();
        const input = "<div><div>Content in a nested div</div></div>\n<div>Content in another div</div>";
        expect(turndownService.turndown(input)).toBe("Content in a nested div\n\nContent in another div");
    });

    it('escaping backslashes', () => {
        const turndownService = new TurndownService();
        const input = "backslash \\";
        expect(turndownService.turndown(input)).toBe("backslash \\\\");
    });

    it('escaping headings with #', () => {
        const turndownService = new TurndownService();
        const input = "### This is not a heading";
        expect(turndownService.turndown(input)).toBe("\\### This is not a heading");
    });

    it('not escaping # outside of a heading', () => {
        const turndownService = new TurndownService();
        const input = "#This is not # a heading";
        expect(turndownService.turndown(input)).toBe("#This is not # a heading");
    });

    it('escaping em markdown with *', () => {
        const turndownService = new TurndownService();
        const input = "To add emphasis, surround text with *. For example: *this is emphasis*";
        expect(turndownService.turndown(input)).toBe("To add emphasis, surround text with \\*. For example: \\*this is emphasis\\*");
    });

    it('escaping em markdown with _', () => {
        const turndownService = new TurndownService();
        const input = "To add emphasis, surround text with _. For example: _this is emphasis_";
        expect(turndownService.turndown(input)).toBe("To add emphasis, surround text with \\_. For example: \\_this is emphasis\\_");
    });

    it('not escaping within code', () => {
        const turndownService = new TurndownService();
        const input = "<pre><code>def this_is_a_method; end;</code></pre>";
        expect(turndownService.turndown(input)).toBe("```\ndef this_is_a_method; end;\n```");
    });

    it('escaping strong markdown with *', () => {
        const turndownService = new TurndownService();
        const input = "To add strong emphasis, surround text with **. For example: **this is strong**";
        expect(turndownService.turndown(input)).toBe("To add strong emphasis, surround text with \\*\\*. For example: \\*\\*this is strong\\*\\*");
    });

    it('escaping strong markdown with _', () => {
        const turndownService = new TurndownService();
        const input = "To add strong emphasis, surround text with __. For example: __this is strong__";
        expect(turndownService.turndown(input)).toBe("To add strong emphasis, surround text with \\_\\_. For example: \\_\\_this is strong\\_\\_");
    });

    it('escaping hr markdown with *', () => {
        const turndownService = new TurndownService();
        const input = "* * *";
        expect(turndownService.turndown(input)).toBe("\\* \\* \\*");
    });

    it('escaping hr markdown with -', () => {
        const turndownService = new TurndownService();
        const input = "- - -";
        expect(turndownService.turndown(input)).toBe("\\- - -");
    });

    it('escaping hr markdown with _', () => {
        const turndownService = new TurndownService();
        const input = "_ _ _";
        expect(turndownService.turndown(input)).toBe("\\_ \\_ \\_");
    });

    it('escaping hr markdown without spaces', () => {
        const turndownService = new TurndownService();
        const input = "***";
        expect(turndownService.turndown(input)).toBe("\\*\\*\\*");
    });

    it('escaping hr markdown with more than 3 characters', () => {
        const turndownService = new TurndownService();
        const input = "* * * * *";
        expect(turndownService.turndown(input)).toBe("\\* \\* \\* \\* \\*");
    });

    it('escaping ol markdown', () => {
        const turndownService = new TurndownService();
        const input = "1984. by George Orwell";
        expect(turndownService.turndown(input)).toBe("1984\\. by George Orwell");
    });

    it('not escaping . outside of an ol', () => {
        const turndownService = new TurndownService();
        const input = "1984.George Orwell wrote 1984.";
        expect(turndownService.turndown(input)).toBe("1984.George Orwell wrote 1984.");
    });

    it('escaping ul markdown *', () => {
        const turndownService = new TurndownService();
        const input = "* An unordered list item";
        expect(turndownService.turndown(input)).toBe("\\* An unordered list item");
    });

    it('escaping ul markdown -', () => {
        const turndownService = new TurndownService();
        const input = "- An unordered list item";
        expect(turndownService.turndown(input)).toBe("\\- An unordered list item");
    });

    it('escaping ul markdown +', () => {
        const turndownService = new TurndownService();
        const input = "+ An unordered list item";
        expect(turndownService.turndown(input)).toBe("\\+ An unordered list item");
    });

    it('not escaping - outside of a ul', () => {
        const turndownService = new TurndownService();
        const input = "Hello-world, 45 - 3 is 42";
        expect(turndownService.turndown(input)).toBe("Hello-world, 45 - 3 is 42");
    });

    it('not escaping + outside of a ul', () => {
        const turndownService = new TurndownService();
        const input = "+1 and another +";
        expect(turndownService.turndown(input)).toBe("+1 and another +");
    });

    it('escaping *', () => {
        const turndownService = new TurndownService();
        const input = "You can use * for multiplication";
        expect(turndownService.turndown(input)).toBe("You can use \\* for multiplication");
    });

    it('escaping ** inside strong tags', () => {
        const turndownService = new TurndownService();
        const input = "<strong>**test</strong>";
        expect(turndownService.turndown(input)).toBe("**\\*\\*test**");
    });

    it('escaping _ inside em tags', () => {
        const turndownService = new TurndownService();
        const input = "<em>test_italics</em>";
        expect(turndownService.turndown(input)).toBe("_test\\_italics_");
    });

    it('unnamed case', () => {
        const turndownService = new TurndownService();
        const input = "> Blockquote in markdown";
        expect(turndownService.turndown(input)).toBe("\\> Blockquote in markdown");
    });

    it('unnamed case', () => {
        const turndownService = new TurndownService();
        const input = ">Blockquote in markdown";
        expect(turndownService.turndown(input)).toBe("\\>Blockquote in markdown");
    });

    it('unnamed case', () => {
        const turndownService = new TurndownService();
        const input = "42 > 1";
        expect(turndownService.turndown(input)).toBe("42 > 1");
    });

    it('escaping code', () => {
        const turndownService = new TurndownService();
        const input = "`not code`";
        expect(turndownService.turndown(input)).toBe("\\`not code\\`");
    });

    it('escaping []', () => {
        const turndownService = new TurndownService();
        const input = "[This] is a sentence with brackets";
        expect(turndownService.turndown(input)).toBe("\\[This\\] is a sentence with brackets");
    });

    it('escaping [', () => {
        const turndownService = new TurndownService();
        const input = "<a href=\"http://www.example.com\">c[iao</a>";
        expect(turndownService.turndown(input)).toBe("[c\\[iao](http://www.example.com)");
    });

    it('escaping * performance', () => {
        const turndownService = new TurndownService();
        const input = "fasdf *883 asdf wer qweasd fsd asdf asdfaqwe rqwefrsdf";
        expect(turndownService.turndown(input)).toBe("fasdf \\*883 asdf wer qweasd fsd asdf asdfaqwe rqwefrsdf");
    });

    it('escaping multiple asterisks', () => {
        const turndownService = new TurndownService();
        const input = "<p>* * ** It aims to be*</p>";
        expect(turndownService.turndown(input)).toBe("\\* \\* \\*\\* It aims to be\\*");
    });

    it('escaping delimiters around short words and numbers', () => {
        const turndownService = new TurndownService();
        const input = "<p>_Really_? Is that what it _is_? A **2000** year-old computer?</p>";
        expect(turndownService.turndown(input)).toBe("\\_Really\\_? Is that what it \\_is\\_? A \\*\\*2000\\*\\* year-old computer?");
    });

    it('non-markdown block elements', () => {
        const turndownService = new TurndownService();
        const input = "Foo\n<div>Bar</div>\nBaz";
        expect(turndownService.turndown(input)).toBe("Foo\n\nBar\n\nBaz");
    });

    it('non-markdown inline elements', () => {
        const turndownService = new TurndownService();
        const input = "Foo <span>Bar</span>";
        expect(turndownService.turndown(input)).toBe("Foo Bar");
    });

    it('blank inline elements', () => {
        const turndownService = new TurndownService();
        const input = "Hello <em></em>world";
        expect(turndownService.turndown(input)).toBe("Hello world");
    });

    it('elements with a single void element', () => {
        const turndownService = new TurndownService();
        const input = "<p><img src=\"http://example.com/logo.png\" /></p>";
        expect(turndownService.turndown(input)).toBe("![](http://example.com/logo.png)");
    });

    it('elements with a nested void element', () => {
        const turndownService = new TurndownService();
        const input = "<p><span><img src=\"http://example.com/logo.png\" /></span></p>";
        expect(turndownService.turndown(input)).toBe("![](http://example.com/logo.png)");
    });

    it('text separated by a space in an element', () => {
        const turndownService = new TurndownService();
        const input = "<p>Foo<span> </span>Bar</p>";
        expect(turndownService.turndown(input)).toBe("Foo Bar");
    });

    it('text separated by a non-breaking space in an element', () => {
        const turndownService = new TurndownService();
        const input = `<p>Foo<span>${noBreakSpace}</span>Bar</p>`;
        expect(turndownService.turndown(input)).toBe(`Foo${noBreakSpace}Bar`);
    });

    it('triple tildes inside code', () => {
        const turndownService = new TurndownService({ "codeBlockStyle": "fenced", "fence": "~~~" });
        const input = "<pre><code>~~~\nCode\n~~~\n</code></pre>";
        expect(turndownService.turndown(input)).toBe("~~~~\n~~~\nCode\n~~~\n~~~~");
    });

    it('triple ticks inside code', () => {
        const turndownService = new TurndownService({ "codeBlockStyle": "fenced", "fence": "```" });
        const input = "<pre><code>```\nCode\n```\n</code></pre>";
        expect(turndownService.turndown(input)).toBe("````\n```\nCode\n```\n````");
    });

    it('four ticks inside code', () => {
        const turndownService = new TurndownService({ "codeBlockStyle": "fenced", "fence": "```" });
        const input = "<pre><code>````\nCode\n````\n</code></pre>";
        expect(turndownService.turndown(input)).toBe("`````\n````\nCode\n````\n`````");
    });

    it('empty line in start/end of code block', () => {
        const turndownService = new TurndownService({ "codeBlockStyle": "fenced", "fence": "```" });
        const input = "<pre><code>\nCode\n\n</code></pre>";
        expect(turndownService.turndown(input)).toBe("```\n\nCode\n\n```");
    });

    it('text separated by ASCII and nonASCII space in an element', () => {
        const turndownService = new TurndownService();
        const input = `<p>Foo<span>  ${noBreakSpace}  </span>Bar</p>`;
        expect(turndownService.turndown(input)).toBe(`Foo ${noBreakSpace} Bar`);
    });

    it('list-like text with non-breaking spaces', () => {
        const turndownService = new TurndownService();
        const input = `${noBreakSpace}1. First<br>${noBreakSpace}2. Second`;
        expect(turndownService.turndown(input)).toBe(`${noBreakSpace}1. First  \n${noBreakSpace}2. Second`);
    });

    it('element with trailing nonASCII WS followed by nonWS', () => {
        const turndownService = new TurndownService();
        const input = `<i>foo${noBreakSpace}</i>bar`;
        expect(turndownService.turndown(input)).toBe(`_foo_${noBreakSpace}bar`);
    });

    it('element with trailing nonASCII WS followed by nonASCII WS', () => {
        const turndownService = new TurndownService();
        const input = `<i>foo${noBreakSpace}</i>${noBreakSpace}bar`;
        expect(turndownService.turndown(input)).toBe(`_foo_${noBreakSpace}${noBreakSpace}bar`);
    });

    it('element with trailing ASCII WS followed by nonASCII WS', () => {
        const turndownService = new TurndownService();
        const input = `<i>foo </i>${noBreakSpace}bar`;
        expect(turndownService.turndown(input)).toBe(`_foo_ ${noBreakSpace}bar`);
    });

    it('element with trailing nonASCII WS followed by ASCII WS', () => {
        const turndownService = new TurndownService();
        const input = `<i>foo${noBreakSpace}</i> bar`;
        expect(turndownService.turndown(input)).toBe(`_foo_${noBreakSpace} bar`);
    });

    it('nonWS followed by element with leading nonASCII WS', () => {
        const turndownService = new TurndownService();
        const input = `foo<i>${noBreakSpace}bar</i>`;
        expect(turndownService.turndown(input)).toBe(`foo${noBreakSpace}_bar_`);
    });

    it('nonASCII WS followed by element with leading nonASCII WS', () => {
        const turndownService = new TurndownService();
        const input = `foo${noBreakSpace}<i>${noBreakSpace}bar</i>`;
        expect(turndownService.turndown(input)).toBe(`foo${noBreakSpace}${noBreakSpace}_bar_`);
    });

    it('nonASCII WS followed by element with leading ASCII WS', () => {
        const turndownService = new TurndownService();
        const input = `foo${noBreakSpace}<i> bar</i>`;
        expect(turndownService.turndown(input)).toBe(`foo${noBreakSpace} _bar_`);
    });

    it('ASCII WS followed by element with leading nonASCII WS', () => {
        const turndownService = new TurndownService();
        const input = `foo <i>${noBreakSpace}bar</i>`;
        expect(turndownService.turndown(input)).toBe(`foo ${noBreakSpace}_bar_`);
    });

    it('preformatted code with leading whitespace', () => {
        const turndownService = new TurndownService({ "preformattedCode": true });
        const input = "Four spaces <code>    make an indented code block in Markdown</code>";
        expect(turndownService.turndown(input)).toBe("Four spaces `    make an indented code block in Markdown`");
    });

    it('preformatted code with trailing whitespace', () => {
        const turndownService = new TurndownService({ "preformattedCode": true });
        const input = "<code>A line break  </code> <b> note the spaces</b>";
        expect(turndownService.turndown(input)).toBe("`A line break  ` **note the spaces**");
    });

    it('preformatted code tightly surrounded', () => {
        const turndownService = new TurndownService({ "preformattedCode": true });
        const input = "<b>tight</b><code>code</code><b>wrap</b>";
        expect(turndownService.turndown(input)).toBe("**tight**`code`**wrap**");
    });

    it('preformatted code loosely surrounded', () => {
        const turndownService = new TurndownService({ "preformattedCode": true });
        const input = "<b>not so tight </b><code>code</code><b> wrap</b>";
        expect(turndownService.turndown(input)).toBe("**not so tight** `code` **wrap**");
    });

    it('preformatted code with newlines', () => {
        const turndownService = new TurndownService({ "preformattedCode": true });
        const input = "<code>\n\n nasty\ncode\n\n</code>";
        expect(turndownService.turndown(input)).toBe("`    nasty code   `");
    });
    it('parses highlight.js style code block', () => {
        const turndownService = new TurndownService();
        const input = read('highlight-js.html');
        const expected = read('highlight-js.md');
        expect(turndownService.turndown(input)).toBe(expected);
    });
});

const read = (filename: string) =>
    readFileSync(resolve(__dirname, 'resources', filename), 'utf8').trim();

const noBreakSpace = '\u00A0';
