const buble = require('rollup-plugin-buble')

module.exports = {
  entry: 'src/index.js',
  dest: 'dist/vue-rx.js',
  format: 'umd',
  moduleName: 'VueRx',
  plugins: [buble()]
}
