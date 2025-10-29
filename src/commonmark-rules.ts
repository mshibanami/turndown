
import { Rule } from './rules';
import { TurndownOptions } from './turndown';
import { repeat, sanitizedLinkContent, sanitizedLinkTitle, trimNewlines } from './utilities';

export const commonmarkRules: { [key: string]: Rule } = {}

commonmarkRules.paragraph = {
  filter: 'p',
  replacement: function (content: string, _node?: Node, _options?: TurndownOptions): string {
    return '\n\n' + content + '\n\n';
  }
};

commonmarkRules.lineBreak = {
  filter: 'br',
  replacement: function (_content: string, _node?: Node, options?: TurndownOptions): string {
    return options.br + '\n';
  }
};

commonmarkRules.heading = {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function (content: string, node?: Node, options?: TurndownOptions): string {
    if (!node) return content;
    const hLevel = Number(node.nodeName.charAt(1));
    if (options.headingStyle === 'setext' && hLevel < 3) {
      const underline = repeat((hLevel === 1 ? '=' : '-'), content.length);
      return (
        '\n\n' + content + '\n' + underline + '\n\n'
      );
    } else {
      return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n';
    }
  }
};

commonmarkRules.blockquote = {
  filter: 'blockquote',
  replacement: function (content: string, _node?: Node, _options?: TurndownOptions): string {
    content = trimNewlines(content).replace(/^/gm, '> ');
    return '\n\n' + content + '\n\n';
  }
};

commonmarkRules.list = {
  filter: ['ul', 'ol'],
  replacement: function (content: string, node?: Node, _options?: TurndownOptions): string {
    if (!node) return content;
    const parent = node.parentNode as Element;
    if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
      return '\n' + content;
    } else {
      return '\n\n' + content + '\n\n';
    }
  }
};

commonmarkRules.listItem = {
  filter: 'li',
  replacement: function (content: string, node?: Node, options?: TurndownOptions): string {
    if (!node) return content;
    let prefix = options.bulletListMarker + '   ';
    const parent = node.parentNode as Element;
    if (parent.nodeName === 'OL') {
      const start = parent.getAttribute('start');
      const index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + '.  ';
    }
    const isParagraph = /\n$/.test(content);
    content = trimNewlines(content) + (isParagraph ? '\n' : '');
    content = content.replace(/\n/gm, '\n' + ' '.repeat(prefix.length)); // indent
    return (
      prefix + content + (node.nextSibling ? '\n' : '')
    );
  }
};

commonmarkRules.indentedCodeBlock = {
  filter: function (node: Node, options?: TurndownOptions): boolean {
    return !!(
      options &&
      options.codeBlockStyle === 'indented' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      (node.firstChild as Element).nodeName === 'CODE'
    );
  },
  replacement: function (_content: string, node?: Node, _options?: TurndownOptions): string {
    if (!node || !node.firstChild) return '';
    return (
      '\n\n    ' +
      (node.firstChild as Element).textContent!.replace(/\n/g, '\n    ') +
      '\n\n'
    );
  }
};

commonmarkRules.fencedCodeBlock = {
  filter: function (node: Node, options?: TurndownOptions): boolean {
    return !!(
      options &&
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      (node.firstChild as Element).nodeName === 'CODE'
    );
  },
  replacement: function (_content: string, node?: Node, options?: TurndownOptions): string {
    if (!node || !node.firstChild) return '';
    const codeElem = node.firstChild as Element;
    const className = codeElem.getAttribute('class') || '';
    const language = (className.match(/language-(\S+)/) || [null, ''])[1];
    const code = codeElem.textContent || '';
    const fenceChar = options.fence.charAt(0);
    let fenceSize = 3;
    const fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');
    let match;
    while ((match = fenceInCodeRegex.exec(code))) {
      if (match[0].length >= fenceSize) {
        fenceSize = match[0].length + 1;
      }
    }
    const fence = repeat(fenceChar, fenceSize);
    return (
      '\n\n' + fence + language + '\n' +
      code.replace(/\n$/, '') +
      '\n' + fence + '\n\n'
    );
  }
};

commonmarkRules.horizontalRule = {
  filter: 'hr',
  replacement: function (_content: string, _node?: Node, options?: TurndownOptions): string {
    return '\n\n' + options.hr + '\n\n';
  }
};

commonmarkRules.inlineLink = {
  filter: function (node: Node, options?: TurndownOptions): boolean {
    return !!(
      options?.linkStyle === 'inlined' &&
      node.nodeName === 'A' &&
      (node as Element).getAttribute('href')
    );
  },
  replacement: function (content: string, node?: Node, options?: TurndownOptions): string {
    const sanitizedContent = sanitizedLinkContent(content);
    if (!node) {
      return content;
    }
    let href = (node as Element)
      .getAttribute('href')
      ?.replace(/([()])/g, '\\$1');
    let title = sanitizedLinkTitle((node as Element).getAttribute('title'));
    if (title) {
      title = ' "' + title.replace(/"/g, '\\"') + '"';
    }
    return '[' + sanitizedContent + '](' + href + title + ')';
  }
};

commonmarkRules.referenceLink = {
  filter: function (node: Node, options?: TurndownOptions): boolean {
    return !!(
      options &&
      options.linkStyle === 'referenced' &&
      node.nodeName === 'A' &&
      (node as Element).getAttribute('href')
    );
  },
  replacement: function (content: string, node?: Node, options?: any): string {
    if (!node) return content;
    const href = (node as Element).getAttribute('href');
    let title = sanitizedLinkTitle((node as Element).getAttribute('title'));
    if (title) title = ' "' + title + '"';
    let replacement: string;
    let reference: string;
    // @ts-ignore
    const self = commonmarkRules.referenceLink;
    switch (options.linkReferenceStyle) {
      case 'collapsed':
        replacement = '[' + content + '][]';
        reference = '[' + content + ']: ' + href + title;
        break;
      case 'shortcut':
        replacement = '[' + content + ']';
        reference = '[' + content + ']: ' + href + title;
        break;
      default: {
        const id = self.references!.length + 1;
        replacement = '[' + content + '][' + id + ']';
        reference = '[' + id + ']: ' + href + title;
        break;
      }
    }
    self.references?.push(reference);
    return replacement;
  },
  references: [],
  append: function (_options?: TurndownOptions): string {
    // @ts-ignore
    const self = commonmarkRules.referenceLink;
    let references = '';
    if (self.references && self.references.length) {
      references = '\n\n' + self.references.join('\n') + '\n\n';
      self.references = [];
    }
    return references;
  }
};

commonmarkRules.emphasis = {
  filter: ['em', 'i'],
  replacement: function (content: string, _node?: Node, options?: TurndownOptions): string {
    if (!content.trim()) return '';
    return options.emDelimiter + content + options.emDelimiter;
  }
};

commonmarkRules.strong = {
  filter: ['strong', 'b'],
  replacement: function (content: string, _node?: Node, options?: TurndownOptions): string {
    if (!content.trim()) return '';
    return options.strongDelimiter + content + options.strongDelimiter;
  }
};

commonmarkRules.code = {
  filter: function (node: Node): boolean {
    const hasSiblings = node.previousSibling || node.nextSibling;
    const parent = node.parentNode as Element;
    const isCodeBlock = parent.nodeName === 'PRE' && !hasSiblings;
    return node.nodeName === 'CODE' && !isCodeBlock;
  },
  replacement: function (content: string, _node?: Node, _options?: TurndownOptions): string {
    if (!content) return '';
    content = content.replace(/\r?\n|\r/g, ' ');
    const extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : '';
    let delimiter = '`';
    const matches: string[] = content.match(/`+/gm) || [];
    while (matches.includes(delimiter)) delimiter = delimiter + '`';
    return delimiter + extraSpace + content + extraSpace + delimiter;
  }
};

commonmarkRules.image = {
  filter: 'img',
  replacement: function (_content: string, node?: Node, _options?: TurndownOptions): string {
    if (!node) return '';
    const alt = sanitizedLinkTitle((node as Element).getAttribute('alt'));
    const src = (node as Element).getAttribute('src') || '';
    const title = sanitizedLinkTitle((node as Element).getAttribute('title'));
    const titlePart = title ? ' "' + title + '"' : '';
    return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : '';
  }
};
