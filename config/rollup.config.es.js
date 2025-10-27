import config from './rollup.config.js'

export default config({
  output: {
    file: 'dist/turndown.es.js',
    format: 'es'
  },
  browser: false
})
