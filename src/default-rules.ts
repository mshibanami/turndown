
import { Rule } from '@/rules';
import { TurnishOptions } from '@/index';
import { repeat, RequireOnly, sanitizedLinkContent, sanitizedLinkTitle, trimNewlines } from '@/utilities';

export const defaultRules: { [key: string]: Rule } = {}

defaultRules.paragraph = {
  filter: 'p',
  replacement: function (content: string): string {
    return '\n\n' + content + '\n\n';
  }
};

defaultRules.lineBreak = {
  filter: 'br',
  replacement: function (_content: string, _node: Node, options: TurnishOptions): string {
    return options.br + '\n';
  }
};

defaultRules.heading = {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function (content: string, node: Node, options: TurnishOptions): string {
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

defaultRules.blockquote = {
  filter: 'blockquote',
  replacement: function (content: string): string {
    content = trimNewlines(content).replace(/^/gm, '> ');
    return '\n\n' + content + '\n\n';
  }
};

defaultRules.list = {
  filter: ['ul', 'ol'],
  replacement: function (content: string, node: Node): string {
    const parent = node.parentNode as Element;
    if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
      return '\n' + content;
    } else {
      return '\n\n' + content + '\n\n';
    }
  }
};

defaultRules.listItem = {
  filter: 'li',
  replacement: function (content: string, node: Node, options: TurnishOptions): string {
    let prefix = options.bulletListMarker + ' '.repeat(options.bulletListMarkerSpaceCount);
    const parent = node.parentNode as Element;
    if (parent.nodeName === 'OL') {
      const start = parent.getAttribute('start');
      const index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + '.' + ' '.repeat(options.bulletListMarkerSpaceCount);
    }
    const isParagraph = /\n$/.test(content);
    content = trimNewlines(content) + (isParagraph ? '\n' : '');

    // Determine indentation for continuation lines
    const indent = options.listItemIndent === 'tab'
      ? '\t'
      : ' '.repeat(options.listItemIndentSpaceCount);
    content = content.replace(/\n/gm, '\n' + indent); // indent
    return (
      prefix + content + (node.nextSibling ? '\n' : '')
    );
  }
};

defaultRules.indentedCodeBlock = {
  filter: function (node: Node, options: TurnishOptions): boolean {
    return !!(
      options &&
      options.codeBlockStyle === 'indented' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      (node.firstChild as Element).nodeName === 'CODE'
    );
  },
  replacement: function (_content: string, node: Node): string {
    if (!node || !node.firstChild) return '';
    return (
      '\n\n    ' +
      (node.firstChild as Element).textContent!.replace(/\n/g, '\n    ') +
      '\n\n'
    );
  }
};

defaultRules.fencedCodeBlock = {
  filter: function (node: Node, options: TurnishOptions): boolean {
    return !!(
      options &&
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      (node.firstChild as Element).nodeName === 'CODE'
    );
  },
  replacement: function (_content: string, node: Node, options: TurnishOptions): string {
    if (!node.firstChild) {
      return '';
    }
    const codeElem = node.firstChild as Element;
    const className = codeElem.getAttribute('class') || '';
    const language = (className.match(/language-(\S+)/) || [null, ''])[1];
    const code = codeElem.textContent || '';
    const fenceChar = options.fence?.charAt(0) || '`';
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

defaultRules.horizontalRule = {
  filter: 'hr',
  replacement: function (_content: string, _node: Node, options: TurnishOptions): string {
    return '\n\n' + options.hr + '\n\n';
  }
};

defaultRules.inlineLink = {
  filter: function (node: Node, options: TurnishOptions): boolean {
    return !!(
      options?.linkStyle === 'inlined' &&
      node.nodeName === 'A' &&
      (node as Element).getAttribute('href')
    );
  },
  replacement: function (content: string, node: Node): string {
    const sanitizedContent = sanitizedLinkContent(content);
    let href = (node as Element)
      .getAttribute('href')
      ?.replace(/([()])/g, '\\$1');
    let title: string;
    const titleAttr = (node as Element).getAttribute('title');
    if (titleAttr) {
      const sanitizedTitle = sanitizedLinkTitle(titleAttr);
      title = ' "' + sanitizedTitle.replace(/"/g, '\\"') + '"';
    } else {
      title = '';
    }
    return '[' + sanitizedContent + '](' + href + title + ')';
  }
};

const referenceLinkRule: RequireOnly<Rule, "urlReferenceIdMap" | "references"> = {
  filter: function (node: Node, options: TurnishOptions): boolean {
    return !!(
      options &&
      options.linkStyle === 'referenced' &&
      node.nodeName === 'A' &&
      (node as Element).getAttribute('href')
    );
  },
  replacement: function (content: string, node: Node, options: TurnishOptions): string {
    const self = referenceLinkRule;

    const href = (node as Element).getAttribute('href');
    let title: string;
    const titleAttr = (node as Element).getAttribute('title');
    if (titleAttr) {
      const sanitizedTitle = sanitizedLinkTitle(titleAttr);
      title = ' "' + sanitizedTitle + '"';
    } else {
      title = '';
    }
    const referenceKey = href + title;

    let replacement: string;
    let reference: string;
    switch (options.linkReferenceStyle) {
      case 'collapsed':
        replacement = '[' + content + '][]';
        reference = '[' + content + ']: ' + referenceKey;
        break;
      case 'shortcut':
        replacement = '[' + content + ']';
        reference = '[' + content + ']: ' + referenceKey;
        break;
      default: {
        let id: number;
        const existingKey = self.urlReferenceIdMap.get(referenceKey);
        if (options.linkReferenceDeduplication === 'full' && existingKey) {
          id = existingKey;
          reference = '[' + id + ']: ' + href + title;
        } else {
          id = self.references.length + 1;
          self.urlReferenceIdMap.set(referenceKey, id);
          reference = '[' + id + ']: ' + href + title;
          self.references.push(reference);
        }
        replacement = '[' + content + '][' + id + ']';
        break;
      }
    }

    if (options.linkReferenceStyle !== 'full') {
      // Check if we should deduplicate
      if (options.linkReferenceDeduplication === 'full') {
        if (!self.urlReferenceIdMap.has(referenceKey)) {
          self.urlReferenceIdMap.set(referenceKey, 1);
          self.references.push(reference);
        }
      } else {
        self.references.push(reference);
      }
    }
    return replacement;
  },
  references: [],
  urlReferenceIdMap: new Map<string, number>(),
  append: (): string => {
    const self = referenceLinkRule;
    let references = '';
    if (self.references && self.references.length) {
      references = '\n\n' + self.references.join('\n') + '\n\n';
      self.references = [];
      self.urlReferenceIdMap = new Map();
    }
    return references;
  }
};

defaultRules.referenceLink = referenceLinkRule;

defaultRules.emphasis = {
  filter: ['em', 'i'],
  replacement: (content: string, _node: Node, options: TurnishOptions): string => {
    content = content.trim();
    if (!content) { return ''; }
    return options.emDelimiter + content + options.emDelimiter;
  }
};

defaultRules.strong = {
  filter: ['strong', 'b'],
  replacement: (content: string, _node: Node, options: TurnishOptions): string => {
    content = content.trim();
    if (!content) { return ''; }
    return options.strongDelimiter + content + options.strongDelimiter;
  }
};

defaultRules.code = {
  filter: (node: Node): boolean => {
    const hasSiblings = node.previousSibling || node.nextSibling;
    const parent = node.parentNode as Element;
    const isCodeBlock = parent.nodeName === 'PRE' && !hasSiblings;
    return node.nodeName === 'CODE' && !isCodeBlock;
  },
  replacement: (content: string): string => {
    const trimmed = content.replace(/\r?\n|\r/g, ' ');
    const extraSpace = /^`|^ .*?[^ ].* $|`$/.test(trimmed) ? ' ' : '';
    let delimiter = '`';
    const matches: string[] = trimmed.match(/`+/gm) || [];
    while (matches.includes(delimiter)) delimiter = delimiter + '`';
    return delimiter + extraSpace + trimmed + extraSpace + delimiter;
  }
};

defaultRules.image = {
  filter: 'img',
  replacement: function (_content: string, node: Node): string {
    const altAttr = (node as Element).getAttribute('alt');
    const alt = altAttr ? sanitizedLinkTitle(altAttr) : '';
    const src = (node as Element).getAttribute('src') || '';
    const titleAttr = (node as Element).getAttribute('title');
    const title = titleAttr ? sanitizedLinkTitle(titleAttr) : '';
    const titlePart = title ? ' "' + title + '"' : '';
    return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : '';
  }
};
