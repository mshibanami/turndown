import config from './rollup.config.js'

export default config({
  output: {
    file: 'lib/turndown.umd.js',
    format: 'umd',
    name: 'TurndownService'
  }
})
