import config from './rollup.config.js'

export default config({
  output: {
    file: 'dist/turndown.js',
    format: 'iife',
    name: 'TurndownService'
  },
  browser: true
})
