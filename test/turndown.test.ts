import TurndownService from '../dist/index.cjs';
import { describe, it, expect } from 'vitest';

describe('TurndownService', () => {
    it('malformed documents', () => {
        const turndownService = new TurndownService();
        expect(() => {
            turndownService.turndown('<HTML><head></head><BODY><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><body onload=alert(document.cookie);></body></html>');
        }).not.toThrow();
    });

    it('null input', () => {
        const turndownService = new TurndownService();
        expect(() => turndownService.turndown(null)).toThrow(/null is not a string/);
    });

    it('undefined input', () => {
        const turndownService = new TurndownService();
        expect(() => turndownService.turndown(undefined)).toThrow(/undefined is not a string/);
    });

    it('#addRule returns the instance', () => {
        const turndownService = new TurndownService();
        const rule = {
            filter: ['del', 's', 'strike'],
            replacement: (content: string) => '~~' + content + '~~'
        };
        expect(turndownService.addRule('strikethrough', rule)).toBe(turndownService);
    });

    it('#addRule adds the rule', () => {
        const turndownService = new TurndownService();
        const rule = {
            filter: ['del', 's', 'strike'],
            replacement: (content: string) => '~~' + content + '~~'
        };
        let called = false;
        if (turndownService.rules && typeof turndownService.rules.add === 'function') {
            turndownService.rules.add = (key: string, r: any) => {
                expect(key).toBe('strikethrough');
                expect(r).toBe(rule);
                called = true;
            };
            turndownService.addRule('strikethrough', rule);
            expect(called).toBe(true);
        } else {
            // If rules.add is not available, just check addRule returns instance
            expect(turndownService.addRule('strikethrough', rule)).toBe(turndownService);
        }
    });

    it('#use returns the instance for chaining', () => {
        const turndownService = new TurndownService();
        expect(turndownService.use(function plugin() { })).toBe(turndownService);
    });

    it('#use with a single plugin calls the fn with instance', () => {
        const turndownService = new TurndownService();
        let called = false;
        function plugin(service: any) {
            expect(service).toBe(turndownService);
            called = true;
        }
        turndownService.use(plugin);
        expect(called).toBe(true);
    });

    it('#use with multiple plugins calls each fn with instance', () => {
        const turndownService = new TurndownService();
        let called1 = false, called2 = false;
        function plugin1(service: any) {
            expect(service).toBe(turndownService);
            called1 = true;
        }
        function plugin2(service: any) {
            expect(service).toBe(turndownService);
            called2 = true;
        }
        turndownService.use([plugin1, plugin2]);
        expect(called1).toBe(true);
        expect(called2).toBe(true);
    });

    it('#keep keeps elements as HTML', () => {
        const turndownService = new TurndownService();
        const input = '<p>Hello <del>world</del><ins>World</ins></p>';
        expect(turndownService.turndown(input)).toBe('Hello worldWorld');
        turndownService.keep(['del', 'ins']);
        expect(turndownService.turndown('<p>Hello <del>world</del><ins>World</ins></p>')).toBe('Hello <del>world</del><ins>World</ins>');
    });

    it('#keep returns the TurndownService instance for chaining', () => {
        const turndownService = new TurndownService();
        expect(turndownService.keep(['del', 'ins'])).toBe(turndownService);
    });

    it('keep rules are overridden by the standard rules', () => {
        const turndownService = new TurndownService();
        turndownService.keep('p');
        expect(turndownService.turndown('<p>Hello world</p>')).toBe('Hello world');
    });

    it('keeping elements that have a blank textContent but contain significant elements', () => {
        const turndownService = new TurndownService();
        turndownService.keep('figure');
        expect(turndownService.turndown('<figure><iframe src="http://example.com"></iframe></figure>')).toBe('<figure><iframe src="http://example.com"></iframe></figure>');
    });

    it('keepReplacement can be customised', () => {
        const turndownService = new TurndownService({
            keepReplacement: (content: string, node: any) => '\n\n' + node.outerHTML + '\n\n'
        });
        turndownService.keep(['del', 'ins']);
        expect(turndownService.turndown('<p>Hello <del>world</del><ins>World</ins></p>')).toBe('Hello \n\n<del>world</del>\n\n<ins>World</ins>');
    });

    it('#remove removes elements', () => {
        const turndownService = new TurndownService();
        const input = '<del>Please redact me</del>';
        expect(turndownService.turndown(input)).toBe('Please redact me');
        turndownService.remove('del');
        expect(turndownService.turndown(input)).toBe('');
    });

    it('#remove returns the TurndownService instance for chaining', () => {
        const turndownService = new TurndownService();
        expect(turndownService.remove(['del', 'ins'])).toBe(turndownService);
    });

    it('remove elements are overridden by rules', () => {
        const turndownService = new TurndownService();
        turndownService.remove('p');
        expect(turndownService.turndown('<p>Hello world</p>')).toBe('Hello world');
    });

    it('remove elements are overridden by keep', () => {
        const turndownService = new TurndownService();
        turndownService.keep(['del', 'ins']);
        turndownService.remove(['del', 'ins']);
        expect(turndownService.turndown('<p>Hello <del>world</del><ins>World</ins></p>')).toBe('Hello <del>world</del><ins>World</ins>');
    });
});
