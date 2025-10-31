import { defineConfig } from 'vite';
import type { UserConfigExport } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

const config: UserConfigExport = defineConfig({
    plugins: [
        dts({
            outDir: './dist/types',
            entryRoot: './src',
            exclude: [
                '**/tests/**',
                '**/*.test.ts'
            ],
        }),
    ],
    build: {
        sourcemap: true,
        lib: {
            entry: 'src/index.ts',
            name: 'Turnish',
            formats: ['es', 'cjs', 'umd', 'iife'],
            fileName: (format: string) => {
                if (format === 'es') { return 'index.mjs'; }
                if (format === 'cjs') { return 'index.cjs'; }
                if (format === 'umd') { return 'index.umd.js'; }
                return `index.${format}.js`;
            }
        },
        rollupOptions: {
            // Externalize dependencies that shouldn't be bundled
            external: ['@mixmark-io/domino'],
            output: {
                globals: {
                    '@mixmark-io/domino': 'domino'
                },
                exports: 'default',
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});

export default config;
