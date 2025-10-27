import config from './rollup.config.js'

export default config({
  output: {
    file: 'lib/turndown.browser.es.js',
    format: 'es'
  },
  browser: true
})
