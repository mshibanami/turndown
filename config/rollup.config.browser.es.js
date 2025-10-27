import config from './rollup.config.js'

export default config({
  output: {
    file: 'dist/turndown.browser.es.js',
    format: 'es'
  },
  browser: true
})
