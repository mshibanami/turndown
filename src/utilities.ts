import { ExtendedNode, NodeTypes } from "./node";

export function repeat(character: string, count: number) {
  return Array(count + 1).join(character)
}

export function trimLeadingNewlines(string: string) {
  return string.replace(/^\n*/, '')
}

export function trimTrailingNewlines(string: string) {
  // avoid match-at-end regexp bottleneck, see #370
  let indexEnd = string.length
  while (indexEnd > 0 && string[indexEnd - 1] === '\n') indexEnd--
  return string.substring(0, indexEnd)
}

export function trimNewlines(string: string) {
  return trimTrailingNewlines(trimLeadingNewlines(string))
}

export const blockElements = [
  'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS',
  'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
  'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
  'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES',
  'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD',
  'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
]

export function isBlock(node: Node) {
  return is(node, blockElements)
}

export const voidElements = [
  'AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT',
  'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
]

export function isVoid(node: Node) {
  return is(node, voidElements)
}

export function hasVoid(node: Node) {
  return has(node, voidElements)
}

const meaningfulWhenBlankElements = [
  'A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT',
  'AUDIO', 'VIDEO'
]

export const standardMarkdownElements = [
  'P', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE',
  'UL', 'OL', 'LI', 'PRE', 'CODE', 'HR', 'A', 'EM', 'I', 'STRONG',
  'B', 'IMG', 'DIV', 'SPAN', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'
]

export function isMeaningfulWhenBlank(node: Node) {
  return is(node, meaningfulWhenBlankElements)
}

export function hasMeaningfulWhenBlank(node: Node) {
  return has(node, meaningfulWhenBlankElements)
}

function is(node: Node, tagNames: string[]) {
  return tagNames.indexOf(node.nodeName) >= 0
}

function has(node: Node, tagNames: string[]) {
  return (
    tagNames.some(function (tagName) {
      if (node.nodeType !== NodeTypes.Element) {
        return false;
      }
      return (node as Element).getElementsByTagName(tagName).length
    })
  )
}

export function sanitizeWhitespace(string: string): string {
  return string ? string.replace(/(\n+\s*)+/g, '\n') : '';
}

export function sanitizedLinkContent(content: string): string {
  const sanitized = sanitizeWhitespace(content);
  return sanitized
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/([()])/g, '\\$1')
    .trim();
}

export function sanitizedLinkTitle(content: string): string {
  const sanitized = sanitizeWhitespace(content);
  return sanitized
    .replace(/[\t\r\n]+/g, ' ');
}

export type RequireOnly<T, K extends keyof T> =
  T & Required<Pick<T, K>>;
