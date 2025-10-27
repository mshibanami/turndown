import config from './rollup.config.js'

export default config({
  output: {
    file: 'dist/turndown.browser.cjs',
    format: 'cjs',
    exports: 'auto'
  },
  browser: true
})
