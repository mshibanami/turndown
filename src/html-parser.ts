/*
 * Set up window for Node.js
 */

const root: typeof globalThis = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {} as any)

/*
 * Parsing HTML strings
 */

function canParseHTMLNatively() {
  const Parser = typeof root.DOMParser !== 'undefined' ? root.DOMParser : undefined;
  let canParse = false;
  if (!Parser) return false;
  // Adapted from https://gist.github.com/1129031
  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if (new Parser().parseFromString('', 'text/html')) {
      canParse = true;
    }
  } catch (e) { }
  return canParse;
}

export class HTMLParser {
  // This will be assigned per environment below
  parseFromString(_input: string, _type?: string): Document {
    throw new Error('Not implemented')
  }
}

function createParser(): HTMLParser {
  const isBrowser =
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    (typeof process === 'undefined' || (process as any).browser === true)

  if (typeof window !== 'undefined') {
    // Browser environment: use DOM API
    class HTMLParserBrowser extends HTMLParser {
      parseFromString(input: string, _type?: string): Document {
        const doc = document.implementation.createHTMLDocument('')
        doc.open()
        doc.write(input)
        doc.close()
        return doc
      }
    }
    return new HTMLParserBrowser()
  } else {
    // Node environment: use domino
    const domino = require('@mixmark-io/domino') as {
      createDocument: (html: string) => Document
    }
    class HTMLParserNode extends HTMLParser {
      parseFromString(input: string, _type?: string): Document {
        return domino.createDocument(input);
      }
    }
    return new HTMLParserNode()
  }
}

export const createHTMLParser = (): HTMLParser =>
  canParseHTMLNatively()
    ? new root.DOMParser()
    : createParser()
