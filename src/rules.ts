/**
 * Manages a collection of rules used to convert HTML to Markdown
 */
import { ExtendedNode } from "./node";
import { TurnishOptions } from "@/index";
import { standardMarkdownElements } from "./utilities";

export type RuleFilterFunction = (node: ExtendedNode, options?: TurnishOptions) => boolean;
export type RuleFilter = string | string[] | RuleFilterFunction;

type RuleReplacementFunction = (...args: any[]) => string;

export interface Rule {
  filter?: RuleFilter;
  replacement: RuleReplacementFunction | ((content: string, node: any, options?: TurnishOptions, previousNode?: any) => string);
  references?: string[];
  /// Map of URL+title combinations to their reference IDs, used for link reference deduplication.
  /// When linkReferenceDeduplication is 'full', this tracks which URLs have already been assigned a reference number to avoid creating duplicate references.
  urlReferenceIdMap?: Map<string, number>;
  append?: (options?: TurnishOptions) => string;
}

export class Rules {
  options: TurnishOptions;
  private _keep: Rule[];
  private _remove: Rule[];
  blankRule: Rule;
  keepReplacement: RuleReplacementFunction;
  markdownIncludingHtmlReplacement: RuleReplacementFunction;
  defaultRule: Rule;
  array: Rule[];

  constructor(options: TurnishOptions) {
    this.options = options;
    this._keep = [];
    this._remove = [];

    this.blankRule = {
      replacement: options.blankReplacement
    };

    this.keepReplacement = options.keepReplacement;
    this.markdownIncludingHtmlReplacement = options.markdownIncludingHtmlReplacement;

    this.defaultRule = {
      replacement: options.defaultReplacement
    };

    this.array = [];
    for (const key in options.rules) {
      this.array.push(options.rules[key]);
    }
  }

  add(key: string, rule: Rule): void {
    this.array.unshift(rule);
  }

  keep(filter: RuleFilter): void {
    this._keep.unshift({
      filter: filter,
      replacement: this.keepReplacement
    });
  }

  remove(filter: RuleFilter): void {
    this._remove.unshift({
      filter: filter,
      replacement: function () {
        return '';
      }
    });
  }

  forNode(node: ExtendedNode): Rule {
    if (node.isBlank) {
      return this.blankRule;
    }
    if (this.options.htmlRetentionMode === 'preserveAll' && this.isUnsupportedElement(node)) {
      return {
        replacement: this.keepReplacement
      };
    }
    if (this.options.htmlRetentionMode === 'markdownIncludingHtml' && this.isUnsupportedElement(node)) {
      return {
        replacement: this.markdownIncludingHtmlReplacement
      };
    }

    let rule: Rule | undefined;
    if ((rule = findRule(this.array, node, this.options))) {
      return rule;
    }
    if ((rule = findRule(this._keep, node, this.options))) {
      return rule;
    }
    if ((rule = findRule(this._remove, node, this.options))) {
      return rule;
    }
    return this.defaultRule;
  }

  /// Check if an element is unsupported for Markdown conversion.
  private isUnsupportedElement(node: ExtendedNode): boolean {
    const nodeName = node.nodeName;

    if (nodeName === 'PRE' && node.firstChild && (node.firstChild as Element).nodeName === 'CODE') {
      const codeElem = node.firstChild as Element;
      if (codeElem.attributes && codeElem.attributes.length > 0) {
        for (let i = 0; i < codeElem.attributes.length; i++) {
          const attrName = codeElem.attributes[i].name.toLowerCase();
          if (attrName !== 'class') {
            return true;
          }
        }
      }
    }

    if (node.attributes && node.attributes.length > 0) {
      switch (nodeName) {
        case 'IMG':
          for (let i = 0; i < node.attributes.length; i++) {
            const attrName = node.attributes[i].name.toLowerCase();
            if (attrName !== 'src' && attrName !== 'alt' && attrName !== 'title') {
              return true;
            }
          }
          return false;
        case 'A':
          for (let i = 0; i < node.attributes.length; i++) {
            const attrName = node.attributes[i].name.toLowerCase();
            if (attrName !== 'href' && attrName !== 'title') {
              return true;
            }
          }
          return false;
        case 'CODE':
          const parent = node.parentNode as Element;
          if (parent && parent.nodeName === 'PRE') {
            for (let i = 0; i < node.attributes.length; i++) {
              const attrName = node.attributes[i].name.toLowerCase();
              if (attrName !== 'class') {
                return true;
              }
            }
            return false;
          }
        default:
          return true;
      }
    }
    // Elements that are not standard HTML elements are unsupported
    if (standardMarkdownElements.indexOf(nodeName) === -1) {
      return true;
    }
    return false;
  }

  forEach(fn: (rule: Rule, index: number) => void): void {
    for (let i = 0; i < this.array.length; i++) {
      fn(this.array[i], i);
    }
  }
}

function findRule(rules: Rule[], node: ExtendedNode, options: TurnishOptions): Rule | undefined {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (filterValue(rule, node, options)) return rule;
  }
  return undefined;
}

function filterValue(rule: Rule, node: ExtendedNode, options: TurnishOptions): boolean {
  const filter = rule.filter;
  if (typeof filter === 'string') {
    if (filter === node.nodeName.toLowerCase()) {
      return true;
    }
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) {
      return true;
    }
  } else if (typeof filter === 'function') {
    if (filter(node, options)) {
      return true;
    }
  } else {
    throw new TypeError('`filter` needs to be a string, array, or function');
  }
  return false;
}
