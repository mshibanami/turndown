import config from './rollup.config.js'

export default config({
  output: {
    file: 'lib/turndown.browser.cjs',
    format: 'cjs',
    exports: 'auto'
  },
  browser: true
})
