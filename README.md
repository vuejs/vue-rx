# vue-rx

Simple [RxJS](https://github.com/Reactive-Extensions/RxJS) binding for Vue.js.

### Usage

With NPM:

``` js
var Vue = require('vue')
var Rx = require('rx')
var VueRx = require('vue-rx')

// tada!
Vue.use(VueRx, Rx)

// now you can bind to Rx observables directly in `data`
new Vue({
  el: '#app',
  data: {
    msg: messageObservable
  }
})
```

With global scripts: just make sure to include `vue-rx.js` after Vue.js and RxJS. It will be installed automatically.

See `/example` for a simple example.
