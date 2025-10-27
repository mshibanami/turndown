import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export default function (config) {
  return {
    input: 'src/turndown.ts',
    output: config.output,
    external: ['@mixmark-io/domino'],
    plugins: [
      typescript(),
      commonjs(),
      replace({ 'process.browser': JSON.stringify(!!config.browser), preventAssignment: true }),
      resolve()
    ]
  }
}
