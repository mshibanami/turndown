import { readFileSync } from 'fs';
import { resolve } from 'path';

export const read = (filename: string) =>
    readFileSync(resolve(__dirname, 'resources', filename), 'utf8').trim();

export const noBreakSpace = '\u00A0';
