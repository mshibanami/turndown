import config from './rollup.config.js'

export default config({
  output: {
    file: 'dist/turndown.umd.js',
    format: 'umd',
    name: 'TurndownService'
  }
})
