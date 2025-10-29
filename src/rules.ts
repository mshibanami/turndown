/**
 * Manages a collection of rules used to convert HTML to Markdown
 */
import { ExtendedNode } from "./node";
import { TurndownOptions } from "./turndown";

export type RuleFilterFunction = (node: ExtendedNode, options?: ReplacementOptions) => boolean;
export type RuleFilter = string | string[] | RuleFilterFunction;

type RuleReplacementFunction = (...args: any[]) => string;

export interface Rule {
  filter?: RuleFilter;
  replacement: RuleReplacementFunction | ((content: string, node: any, options?: any, previousNode?: any) => string);
  references?: string[];
  append?: (options?: any) => string;
}

export interface ReplacementOptions {
  br?: string;
  headingStyle?: string;
  codeBlockStyle?: string;
  fence?: string;
  hr?: string;
  bulletListMarker?: string;
  linkStyle?: string;
  linkReferenceStyle?: string;
  emDelimiter?: string;
  strongDelimiter?: string;
  anchorNames?: string[];
  preserveColorStyles?: boolean;
  allowResourcePlaceholders?: boolean;
  preserveImageTagsWithSize?: boolean;
}

export class Rules {
  options: TurndownOptions;
  private _keep: Rule[];
  private _remove: Rule[];
  blankRule: Rule;
  keepReplacement: RuleReplacementFunction;
  defaultRule: Rule;
  array: Rule[];

  constructor(options: TurndownOptions) {
    this.options = options;
    this._keep = [];
    this._remove = [];

    this.blankRule = {
      replacement: options.blankReplacement
    };

    this.keepReplacement = options.keepReplacement;

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
    if (node.isBlank) return this.blankRule
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

  forEach(fn: (rule: Rule, index: number) => void): void {
    for (let i = 0; i < this.array.length; i++) {
      fn(this.array[i], i);
    }
  }
}

function findRule(rules: Rule[], node: Node, options: TurndownOptions): Rule | undefined {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (filterValue(rule, node, options)) return rule;
  }
  return undefined;
}

function filterValue(rule: Rule, node: Node, options: TurndownOptions): boolean {
  const filter = rule.filter
  if (typeof filter === 'string') {
    if (filter === node.nodeName.toLowerCase()) return true
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
  } else if (typeof filter === 'function') {
    if (filter.call(rule, node, options)) return true
  } else {
    throw new TypeError('`filter` needs to be a string, array, or function')
  }
}
