import collapseWhitespace from '@/collapse-whitespace'
import { createHTMLParser, HTMLParser } from '@/html-parser'
import { isBlock, isVoid } from '@/utilities'

interface RootNodeOptions {
  preformattedCode?: boolean
}

export default function RootNode(
  input: string | Node,
  options: RootNodeOptions
): Element {
  let root: Element
  if (typeof input === 'string') {
    const doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turnish id="turnish-root">' + input + '</x-turnish>',
      'text/html'
    )
    root = doc.getElementById('turnish-root') as Element
  } else {
    root = input.cloneNode(true) as Element
  }
  collapseWhitespace({
    element: root,
    isBlock: isBlock,
    isVoid: isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  })

  return root
}

let _htmlParser: HTMLParser | undefined
function htmlParser(): HTMLParser {
  return (_htmlParser ??= createHTMLParser())
}

function isPreOrCode(node: Node): boolean {
  return node.nodeName === 'PRE' || node.nodeName === 'CODE';
}
