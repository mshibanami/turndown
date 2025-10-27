import { defineConfig } from 'vite';
import type { UserConfigExport } from 'vite';

const config: UserConfigExport = defineConfig({
    build: {
        lib: {
            entry: 'src/turndown.ts',
            name: 'Turndown',
            formats: ['es', 'cjs', 'umd', 'iife'],
            fileName: (format: string) => {
                if (format === 'es') { return 'index.mjs'; }
                if (format === 'cjs') { return 'index.cjs'; }
                if (format === 'umd') { return 'index.umd.js'; }
                return `index.${format}.js`;
            }
        },
        outDir: 'lib',
        rollupOptions: {
            // Externalize dependencies that shouldn't be bundled
            external: ['@mixmark-io/domino'],
            output: {
                globals: {
                    '@mixmark-io/domino': 'domino'
                },
                exports: 'named'
            }
        }
    }
});

export default config;
