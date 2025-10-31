import Turnish from '../src';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Rule } from '@/rules';
import { ExtendedNode } from '@/node';
import { gfm } from '@joplin/turndown-plugin-gfm';
import { read } from './utilities';

describe('@joplin/turndown-plugin-gfm', () => {
    it('converts strikethrough syntax', () => {
        const gfmTurnish = new Turnish();
        gfmTurnish.use(gfm);
        expect.soft(gfmTurnish.render('<p><strike>Lorem ipsum</strike></p>')).toBe('~~Lorem ipsum~~');

        const vanillaTurnish = new Turnish();
        const input = '<p><strike>Lorem ipsum</strike></p>';
        const output = vanillaTurnish.render(input);
        expect.soft(output.trim()).toBe('Lorem ipsum');
    });

    it('converts tables', () => {
        const gfmTurnish = new Turnish();
        gfmTurnish.use(gfm);
        expect.soft(gfmTurnish.render(read('gfm-table.html')).trim()).toBe(read('gfm-table.md'));
    });

    it('converts task lists', () => {
        const gfmTurnish = new Turnish();
        gfmTurnish.use(gfm);
        expect.soft(gfmTurnish.render(read('gfm-task-list.html')).trim()).toBe(read('gfm-task-list.md'));
    });
});
