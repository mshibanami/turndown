import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        lib: {
            entry: 'src/turndown.ts',
            name: 'Turndown',
            formats: ['es', 'cjs', 'umd', 'iife'],
            fileName: (format) => {
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
                }
            }
        }
    }
})
