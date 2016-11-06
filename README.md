# vue-rx

Simple [RxJS](https://github.com/Reactive-Extensions/RxJS) binding for Vue.js. It also supports subscriptions for generic observables that implement the `.subscribe` and `.unsubscribe` (or `.dispise`) interface. For example, you can use it to subscribe to `most.js` or Falcor streams, but some features require RxJS to work.

### Installation

#### NPM + ES2015

``` bash
npm install vue vue-rx rxjs --save
```

``` js
import Vue from 'vue'
import Rxfrom 'rxjs/Rx'
import VueRx from 'vue-rx'

// tada!
Vue.use(VueRx, Rx)
```

#### Global Script

Just make sure to include `vue-rx.js` after Vue.js and RxJS. It will be installed automatically.

### Usage

``` js
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

#### `$watchAsObservable`

> This feature requires RxJS.

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
