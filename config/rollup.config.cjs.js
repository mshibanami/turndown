import config from './rollup.config.js'

export default config({
  output: {
    file: 'lib/turndown.cjs',
    format: 'cjs',
    exports: 'auto'
  },
  browser: false
})
