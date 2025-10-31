# Turnish

[![Test](https://github.com/mshibanami/turnish/actions/workflows/test.yml/badge.svg)](https://github.com/mshibanami/turnish/actions/workflows/test.yml)

Turnish is a HTML to Markdown converter written in JavaScript.

This is a fork of [Turndown](https://github.com/mixmark-io/turndown), originally created by Dom Christie.

## Turnish vs Turndown

**Library user perspective:**

* Fixed various issues, such as:
  * escaping unwanted characters that can break the Markdown rendering.
  * removing new lines in link texts.
* Added an option to configure how non-standard or unsupported HTML fragments are handled during conversion. For example, whether to convert them to Markdown where possible, preserve them as raw HTML, or retain them (adding a `markdown="1"` attribute when the HTML contains Markdown) so Markdown processors can parse any embedded Markdown.
* Changed the default behavior to better comply with de facto standards.
* Remains compatible with Turndown plugins.
* Remains licensed under the MIT License.

**Library/plugin developer perspective:**

* Updated to TypeScript
* Modernized build system using Vite

## Installation

npm:

```sh
npm install turnish
```

pnpm:

```sh
pnpm install turnish
```

Browser:

```html
<script src="https://cdn.jsdelivr.net/npm/turnish@latest/dist/index.iife.js"></script>
```

## Usage

For Node.js:

```js
var Turnish = require('turnish')

var turnish = new Turnish()
var markdown = turnish.render('<h1>Hello world!</h1>')
```

ES module import (Node with ESM, bundlers, or browsers supporting modules):

```js
import Turnish from 'turnish'

const turnish = new Turnish()
const markdown = turnish.render('<h1>Hello world!</h1>')
```

Turnish also accepts DOM nodes as input (either element nodes, document nodes,  or document fragment nodes):

```js
var markdown = turnish.render(document.getElementById('content'))
```

## Options

Options can be passed in to the constructor on instantiation. For example:

```js
var turnish = new Turnish({ option: 'value' })
```

| Option                       | Valid values                                                                  | Default    |
| :--------------------------- | :---------------------------------------------------------------------------- | :--------- |
| `headingStyle`               | `setext` or `atx`                                                             | `atx`      |
| `hr`                         | Any [Thematic break](http://spec.commonmark.org/0.27/#thematic-breaks)        | `---`      |
| `bulletListMarker`           | `-`, `+`, or `*`                                                              | `-`        |
| `codeBlockStyle`             | `indented` or `fenced`                                                        | `fenced`   |
| `fence`                      | ` ``` ` or `~~~`                                                              | ` ``` `    |
| `emDelimiter`                | `_` or `*`                                                                    | `*`        |
| `strongDelimiter`            | `**` or `__`                                                                  | `**`       |
| `linkStyle`                  | `inlined` or `referenced`                                                     | `inlined`  |
| `linkReferenceStyle`         | `full`, `collapsed`, or `shortcut`                                            | `full`     |
| `preformattedCode`           | `false` or [`true`](https://github.com/lucthev/collapse-whitespace/issues/16) | `false`    |
| `linkReferenceDeduplication` | `none` or `full`                                                              | `full`     |
| `htmlRetentionMode`          | `standard`, `preserveAll`, or `markdownIncludingHtml`                         | `standard` |

### Advanced Options

| Option               | Valid values              | Default                     |
| :------------------- | :------------------------ | :-------------------------- |
| `blankReplacement`   | rule replacement function | See **Special Rules** below |
| `keepReplacement`    | rule replacement function | See **Special Rules** below |
| `defaultReplacement` | rule replacement function | See **Special Rules** below |

## Methods

### `addRule(key, rule)`

The `key` parameter is a unique name for the rule for easy reference. Example:

```js
turnish.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: function (content) {
    return '~' + content + '~'
  }
})
```

`addRule` returns the `Turnish` instance for chaining.

See **Extending with Rules** below.

### `keep(filter)`

Determines which elements are to be kept and rendered as HTML. By default, Turndown does not keep any elements. The filter parameter works like a rule filter (see section on filters belows). Example:

```js
turnish.keep(['del', 'ins'])
turnish.render('<p>Hello <del>world</del><ins>World</ins></p>') // 'Hello <del>world</del><ins>World</ins>'
```

This will render `<del>` and `<ins>` elements as HTML when converted.

`keep` can be called multiple times, with the newly added keep filters taking precedence over older ones. Keep filters will be overridden by the standard CommonMark rules and any added rules. To keep elements that are normally handled by those rules, add a rule with the desired behaviour.

`keep` returns the `Turnish` instance for chaining.

### `remove(filter)`

Determines which elements are to be removed altogether i.e. converted to an empty string. By default, Turnish does not remove any elements. The filter parameter works like a rule filter (see section on filters belows). Example:

```js
turnish.remove('del')
turnish.render('<p>Hello <del>world</del><ins>World</ins></p>') // 'Hello World'
```

This will remove `<del>` elements (and contents).

`remove` can be called multiple times, with the newly added remove filters taking precedence over older ones. Remove filters will be overridden by the keep filters,  standard CommonMark rules, and any added rules. To remove elements that are normally handled by those rules, add a rule with the desired behaviour.

`remove` returns the `Turnish` instance for chaining.

### `use(plugin|array)`

Use a plugin, or an array of plugins. Example:

```js
// Import plugins from turndown-plugin-gfm
var turndownPluginGfm = require('turndown-plugin-gfm')
var gfm = turndownPluginGfm.gfm
var tables = turndownPluginGfm.tables
var strikethrough = turndownPluginGfm.strikethrough

// Use the gfm plugin
turnish.use(gfm)

// Use the table and strikethrough plugins only
turnish.use([tables, strikethrough])
```

`use` returns the `Turnish` instance for chaining.

See **Plugins** below.

## Extending with Rules

Turnish can be extended by adding **rules**. A rule is a plain JavaScript object with `filter` and `replacement` properties. For example, the rule for converting `<p>` elements is as follows:

```js
{
  filter: 'p',
  replacement: function (content) {
    return '\n\n' + content + '\n\n'
  }
}
```

The filter selects `<p>` elements, and the replacement function returns the `<p>` contents separated by two new lines.

### `filter` string|Array|Function

The filter property determines whether or not an element should be replaced with the rule's `replacement`. DOM nodes can be selected simply using a tag name or an array of tag names:

 * `filter: 'p'` will select `<p>` elements
 * `filter: ['em', 'i']` will select `<em>` or `<i>` elements

The tag names in the `filter` property are expected in lowercase, regardless of their form in the document.

Alternatively, the filter can be a function that returns a boolean depending on whether a given node should be replaced. The function is passed a DOM node as well as the `Turnish` options. For example, the following rule selects `<a>` elements (with an `href`) when the `linkStyle` option is `inlined`:

```js
filter: function (node, options) {
  return (
    options.linkStyle === 'inlined' &&
    node.nodeName === 'A' &&
    node.getAttribute('href')
  )
}
```

### `replacement` Function

The replacement function determines how an element should be converted. It should return the Markdown string for a given node. The function is passed the node's content, the node itself, and the `Turnish` options.

The following rule shows how `<em>` elements are converted:

```js
rules.emphasis = {
  filter: ['em', 'i'],

  replacement: function (content, node, options) {
    return options.emDelimiter + content + options.emDelimiter
  }
}
```

### Special Rules

**Blank rule** determines how to handle blank elements. It overrides every rule (even those added via `addRule`). A node is blank if it only contains whitespace, and it's not an `<a>`, `<td>`,`<th>` or a void element. Its behaviour can be customised using the `blankReplacement` option.

**Keep rules** determine how to handle the elements that should not be converted, i.e. rendered as HTML in the Markdown output. By default, no elements are kept. Block-level elements will be separated from surrounding content by blank lines. Its behaviour can be customised using the `keepReplacement` option.

**Remove rules** determine which elements to remove altogether. By default, no elements are removed.

**Default rule** handles nodes which are not recognised by any other rule. By default, it outputs the node's text content (separated  by blank lines if it is a block-level element). Its behaviour can be customised with the `defaultReplacement` option.

### Rule Precedence

Turnish iterates over the set of rules, and picks the first one that matches the `filter`. The following list describes the order of precedence:

1. Blank rule
2. Added rules (optional)
3. Commonmark rules
4. Keep rules
5. Remove rules
6. Default rule

## Plugins

The plugin API provides a convenient way for developers to apply multiple extensions. A plugin is just a function that is called with the `Turnish` instance.

## Escaping Markdown Characters

Turnish uses backslashes (`\`) to escape Markdown characters in the HTML input. This ensures that these characters are not interpreted as Markdown when the output is compiled back to HTML. For example, the contents of `<h1>1. Hello world</h1>` needs to be escaped to `1\. Hello world`, otherwise it will be interpreted as a list item rather than a heading.

To avoid the complexity and the performance implications of parsing the content of every HTML element as Markdown, Turnish uses a group of regular expressions to escape potential Markdown syntax. As a result, the escaping rules can be quite aggressive.

### Overriding `Turnish.prototype.escape`

If you are confident in doing so, you may want to customise the escaping behaviour to suit your needs. This can be done by overriding `Turnish.prototype.escape`. `escape` takes the text of each HTML element and should return a version with the Markdown characters escaped.

Note: text in code elements is never passed to`escape`.

## License

[MIT License](LICENSE)

Copyright (c) 2025- Manabu Nakazawa
Copyright (c) 2017-2025 Dom Christie

Turnish is originally based on [Turndown](https://github.com/mixmark-io/turndown) by Dom Christie, and is licensed under the MIT License.
