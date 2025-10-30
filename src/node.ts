import { isBlock, isVoid, hasVoid, isMeaningfulWhenBlank, hasMeaningfulWhenBlank } from '@/utilities'

interface Options {
  preformattedCode?: boolean;
}

interface FlankingWhitespace {
  leading: string;
  trailing: string;
}

interface EdgeWhitespace extends FlankingWhitespace {
  leadingAscii: string;
  leadingNonAscii: string;
  trailingNonAscii: string;
  trailingAscii: string;
}

export interface ExtendedNode extends Element {
  isBlock: boolean;
  isCode: boolean;
  isBlank: boolean;
  flankingWhitespace: FlankingWhitespace;
}

export function ExtendedNode(node: Node, options: Options): ExtendedNode {
  const extended = node as ExtendedNode;
  extended.isBlock = isBlock(extended);
  extended.isCode = extended.nodeName === 'CODE' || (extended.parentNode as ExtendedNode)?.isCode;
  extended.isBlank = isBlank(extended);
  extended.flankingWhitespace = flankingWhitespace(extended, options);
  return extended;
}

function isBlank(node: ExtendedNode): boolean {
  return (
    !isVoid(node) &&
    !isMeaningfulWhenBlank(node) &&
    /^\s*$/i.test(node.textContent || '') &&
    !hasVoid(node) &&
    !hasMeaningfulWhenBlank(node)
  )
}

function flankingWhitespace(node: ExtendedNode, options: Options): FlankingWhitespace {
  const extendedNode = node as ExtendedNode;

  if (extendedNode.isBlock || (options.preformattedCode && extendedNode.isCode)) {
    return { leading: '', trailing: '' };
  }

  const edges = edgeWhitespace(node.textContent || '');

  // abandon leading ASCII WS if left-flanked by ASCII WS
  if (edges.leadingAscii && isFlankedByWhitespace('left', node, options)) {
    edges.leading = edges.leadingNonAscii;
  }

  // abandon trailing ASCII WS if right-flanked by ASCII WS
  if (edges.trailingAscii && isFlankedByWhitespace('right', node, options)) {
    edges.trailing = edges.trailingNonAscii;
  }

  return { leading: edges.leading, trailing: edges.trailing };
}

function edgeWhitespace(string: string): EdgeWhitespace {
  const m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);

  if (!m) {
    return {
      leading: '',
      leadingAscii: '',
      leadingNonAscii: '',
      trailing: '',
      trailingNonAscii: '',
      trailingAscii: ''
    };
  }

  return {
    leading: m[1], // whole string for whitespace-only strings
    leadingAscii: m[2],
    leadingNonAscii: m[3],
    trailing: m[4], // empty for whitespace-only strings
    trailingNonAscii: m[5],
    trailingAscii: m[6]
  };
}

function isFlankedByWhitespace(side: 'left' | 'right', node: Element, options: Options): boolean {
  let sibling: Element | null;
  let regExp: RegExp;
  let isFlanked: boolean | undefined;

  if (side === 'left') {
    sibling = node.previousElementSibling;
    regExp = / $/;
  } else {
    sibling = node.nextElementSibling;
    regExp = /^ /;
  }

  if (sibling) {
    if (sibling.nodeType === 3) {
      isFlanked = regExp.test(sibling.nodeValue || '');
    } else if (options.preformattedCode && sibling.nodeName === 'CODE') {
      isFlanked = false;
    } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
      isFlanked = regExp.test(sibling.textContent || '');
    }
  }

  return isFlanked || false;
}

export const NodeTypes = {
  Element: 1,
  Text: 3,
  CDATASection: 4,
  Comment: 8
} as const;

export type NodeType = typeof NodeTypes[keyof typeof NodeTypes];
