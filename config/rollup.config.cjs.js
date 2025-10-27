import config from './rollup.config.js'

export default config({
  output: {
    file: 'dist/turndown.cjs',
    format: 'cjs',
    exports: 'auto'
  },
  browser: false
})
