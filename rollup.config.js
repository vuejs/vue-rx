const buble = require('rollup-plugin-buble')

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/vue-rx.js',
    format: 'umd',
    name: 'VueRx',
  },
  plugins: [buble()]
}
