import { defaultRules } from '@/default-rules'
import { Rules, Rule, RuleFilter } from '@/rules'
import { extend, trimLeadingNewlines, trimTrailingNewlines } from '@/utilities'
import RootNode from '@/root-node'
import { ExtendedNode, NodeTypes } from '@/node';
const reduce = Array.prototype.reduce

type EscapeRule = [RegExp, string];

const escapes: EscapeRule[] = [
  [/\\/g, '\\\\'],
  [/\*/g, '\\*'],
  [/_/g, '\\_'],
  [/^-/g, '\\-'],
  [/^\+ /g, '\\+ '],
  [/^(=+)/g, '\\$1'],
  [/^(#{1,6}) /g, '\\$1 '],
  [/`/g, '\\`'],
  [/^~~~/g, '\\~~~'],
  [/\[/g, '\\['],
  [/\]/g, '\\]'],
  [/<([^>]*)>/g, '\\<$1\\>'],
  [/^>/g, '\\>'],
  [/^(\d+)\. /g, '$1\\. ']
];

type Plugin = (service: Turnish) => void;

export interface TurnishOptions {
  rules?: { [key: string]: Rule };
  headingStyle?: 'setext' | 'atx';
  hr?: string;
  bulletListMarker?: '*' | '-' | '+';
  codeBlockStyle?: 'indented' | 'fenced';
  fence?: string;
  emDelimiter?: '_' | '*';
  strongDelimiter?: '**' | '__';
  linkStyle?: 'inlined' | 'referenced';
  linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
  linkReferenceDeduplication?: 'none' | 'full';
  br?: string;
  preformattedCode?: boolean;
  htmlRetentionMode?: 'standard' | 'preserveAll' | 'markdownIncludingHtml';
  blankReplacement?: (content: string, node: ExtendedNode) => string;
  keepReplacement?: (content: string, node: ExtendedNode) => string;
  markdownIncludingHtmlReplacement?: (content: string, node: ExtendedNode) => string;
  defaultReplacement?: (content: string, node: ExtendedNode) => string;
  [key: string]: any;
}


const defaultOptions: TurnishOptions = {
  rules: defaultRules,
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
  linkReferenceDeduplication: 'full',
  br: '  ',
  preformattedCode: false,
  htmlRetentionMode: 'standard',
  blankReplacement: (content: string, node: ExtendedNode): string => {
    return node.isBlock ? '\n\n' : '';
  },
  keepReplacement: (content: string, node: ExtendedNode): string => {
    return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML;
  },
  markdownIncludingHtmlReplacement: (content: string, node: ExtendedNode): string => {
    const tagName = node.nodeName.toLowerCase();

    let attributes = '';
    if (node.attributes && node.attributes.length > 0) {
      const attrs: string[] = [];
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        attrs.push(`${attr.name}="${attr.value}"`);
      }
      attributes = ' ' + attrs.join(' ');
    }

    attributes += ' markdown="1"';

    const openTag = `<${tagName}${attributes}>`;
    const closeTag = `</${tagName}>`;

    const trimmedContent = content.trim();
    const html = openTag + '\n' + trimmedContent + '\n' + closeTag;

    return node.isBlock ? '\n\n' + html + '\n\n' : html;
  },
  defaultReplacement: function (content: string, node: ExtendedNode): string {
    return node.isBlock ? '\n\n' + content + '\n\n' : content;
  }
};

export default class Turnish {
  options: TurnishOptions;
  rules: Rules;

  constructor(options?: TurnishOptions) {
    this.options = extend({}, defaultOptions, options);
    this.rules = new Rules(this.options);
  }

  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {InputType} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type string
   */
  render(input: InputType): string {
    if (!canConvert(input)) {
      throw new TypeError(
        input + ' is not a string, or an element/document/fragment node.'
      );
    }
    if (input === '') {
      return '';
    }
    const output = this.process(RootNode(input, this.options));
    return this.postProcess(output);
  }

  /**
   * Add one or more plugins
   * @public
   * @param {Plugin|Plugin[]} plugin The plugin or array of plugins to add
   * @returns The Turnish instance for chaining
   * @type Object
   */
  use(plugin: Plugin | Plugin[]): Turnish {
    if (Array.isArray(plugin)) {
      for (let i = 0; i < plugin.length; i++) this.use(plugin[i]);
    } else if (typeof plugin === 'function') {
      plugin(this);
    } else {
      throw new TypeError('plugin must be a Function or an Array of Functions');
    }
    return this;
  }

  /**
   * Adds a rule
   * @public
   * @param {string} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turnish instance for chaining
   * @type Object
   */
  addRule(key: string, rule: Rule): Turnish {
    this.rules.add(key, rule);
    return this;
  }

  /**
   * Keep a node (as HTML) that matches the filter
   * @public
   * @param {RuleFilter} filter The unique key of the rule
   * @returns The Turnish instance for chaining
   * @type Object
   */
  keep(filter: RuleFilter): Turnish {
    this.rules.keep(filter);
    return this;
  }

  /**
   * Remove a node that matches the filter
   * @public
   * @param {string|Array|Function} filter The unique key of the rule
   * @returns The Turnish instance for chaining
   * @type Object
   */
  remove(filter: RuleFilter): Turnish {
    this.rules.remove(filter);
    return this;
  }

  /**
   * Escapes Markdown syntax
   * @public
   * @param {string} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type string
   */
  escape(string: string): string {
    return escapes.reduce(function (accumulator: string, escape: EscapeRule) {
      return accumulator.replace(escape[0], escape[1]);
    }, string);
  }


  /**
   * Reduces a DOM node down to its Markdown string equivalent
   * @private
   * @param {HTMLElement} parentNode The node to convert
   * @returns A Markdown representation of the node
   * @type string
   */
  process(this: Turnish, parentNode: Node): string {
    return Array.from(parentNode.childNodes).reduce((output, node) => {
      const extended = ExtendedNode(node, this.options);
      let replacement = '';
      if (extended.nodeType === NodeTypes.Text) {
        const value = extended.nodeValue ?? ''; // ensure a string
        replacement = extended.isCode ? value : this.escape(value);
      } else if (extended.nodeType === NodeTypes.Element) {
        replacement = this.replacementForNode(extended);
      }
      return join(output, replacement);
    }, '');
  }

  /**
   * Appends strings as each rule requires and trims the output
   * @private
   * @param {string} output The conversion output
   * @returns A trimmed version of the ouput
   * @type string
   */
  postProcess(output: string): string {
    for (const rule of this.rules.array) {
      if (rule.append) {
        output = join(output, rule.append(this.options))
      }
    }
    return output
      .replace(/^[\t\r\n]+/, '')
      .replace(/[\t\r\n\s]+$/, '')
  }


  /**
   * Converts an element node to its Markdown equivalent
   * @private
   * @param {ExtendedNode} node The node to convert
   * @returns A Markdown representation of the node
   * @type string
   */
  replacementForNode(node: ExtendedNode) {
    const rule = this.rules.forNode(node)
    let content = this.process(node)
    const whitespace = node.flankingWhitespace
    if (whitespace.leading || whitespace.trailing) {
      content = content.trim()
    }
    return (
      whitespace.leading +
      rule.replacement(content, node, this.options) +
      whitespace.trailing
    )
  }
}

/**
 * Joins replacement to the current output with appropriate number of new lines
 * @private
 * @param {string} output The current conversion output
 * @param {string} replacement The string to append to the output
 * @returns Joined output
 * @type string
 */
function join(output: string, replacement: string): string {
  const s1 = trimTrailingNewlines(output)
  const s2 = trimLeadingNewlines(replacement)
  const nls = Math.max(output.length - s1.length, replacement.length - s2.length)
  const separator = '\n\n'.substring(0, nls)

  return s1 + separator + s2
}

/**
 * Determines whether an input can be converted
 * @private
 * @param {string|HTMLElement} input Describe this parameter
 * @returns Describe what it returns
 * @type string|Object|Array|Boolean|Number
 */
type InputType = string | HTMLElement | Document | DocumentFragment;
function canConvert(input: any): input is InputType {
  return (
    input != null && (
      typeof input === 'string' ||
      (input.nodeType && (
        input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11
      ))
    )
  );
}
