const alias = require('rollup-plugin-alias')
const buble = require('rollup-plugin-buble')

module.exports = [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/vue-rx.esm.js',
      format: 'es'
    },
    plugins: [buble()],
    external: [
      'rxjs',
      'rxjs/operators'
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/vue-rx.js',
      format: 'umd',
      name: 'VueRx'
    },
    plugins: [
      buble(),
      alias({
        'rxjs/operators': 'src/umd-aliases/operators.js',
        'rxjs': 'src/umd-aliases/rxjs.js'
      })
    ]
  }
]
