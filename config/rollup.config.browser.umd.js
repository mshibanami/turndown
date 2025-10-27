import config from './rollup.config.js'

export default config({
  output: {
    file: 'lib/turndown.browser.umd.js',
    format: 'umd',
    name: 'TurndownService'
  },
  browser: true
})
