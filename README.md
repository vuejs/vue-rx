# vue-rx

Simple [RxJS](https://github.com/Reactive-Extensions/RxJS) binding for Vue.js.

### Installation

- With global scripts: just make sure to include `vue-rx.js` after Vue.js and RxJS. It will be installed automatically.

- With NPM:

  ``` js
  var Vue = require('vue')
  var Rx = require('rx')
  var VueRx = require('vue-rx')

  // tada!
  Vue.use(VueRx, Rx)

  // The second argument is optional if you are not using RxJS but other generic observable implementations:
  Vue.use(VueRx)
  ```

### Usage

With NPM:

``` js
var Vue = require('vue')
var Rx = require('rx')
var VueRx = require('vue-rx')

// tada!
Vue.use(VueRx, Rx)

// provide Rx observables with the `subscriptions` option
new Vue({
  el: '#app',
  subscriptions: {
    msg: messageObservable
  }
})
```

``` html
<!-- bind to it normally in templates -->
<div>{{ msg }}</div>
```

The `subscriptions` options can also take a function so that you can return unique observables for each component instance:

``` js
Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: Rx.Observable.create(...)
    }
  }
})
```

### Using with Alternative Observable Implementations

You can use this plugin with other observable implementations, as long as it implements the `.subscribe` and `.dispose / .unsubscribe` interface. For example, you can use it with `most.js` or Falcor streams.

### `$watchAsObservable`

> This feature requires using RxJS.

This is a prototype method added to instances. You can use it to create an observable from a value watcher:

``` js
created:function () {
  this.$watchAsObservable('a')
    .subscribe(function (val) {
      console.log('stream value', val)
    },function (err) {
      console.error(err)
    },function () {
      console.log('complete')
    })
}
```

### Example

See `/example` for a simple example.

### License

[MIT](http://opensource.org/licenses/MIT)
