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

function createHTMLParser() {
  const Parser = function () { }

  if (typeof window !== 'undefined') {
    if (shouldUseActiveX()) {
      Parser.prototype.parseFromString = function (string: string) {
        const doc = new (window as any).ActiveXObject('htmlfile');
        doc.designMode = 'on'; // disable on-page scripts
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    } else {
      Parser.prototype.parseFromString = function (string: string) {
        const doc = document.implementation.createHTMLDocument('');
        doc.open();
        doc.write(string);
        doc.close();
        return doc;
      };
    }
  } else {
    const domino = require('@mixmark-io/domino');
    Parser.prototype.parseFromString = function (string: string) {
      return domino.createDocument(string);
    };
  }
  return Parser
}

function shouldUseActiveX() {
  let useActiveX = false;
  try {
    document.implementation.createHTMLDocument('').open();
  } catch (e) {
    if (typeof root.ActiveXObject !== 'undefined') useActiveX = true;
  }
  return useActiveX;
}

export default canParseHTMLNatively() && typeof root.DOMParser !== 'undefined' ? root.DOMParser : createHTMLParser();
