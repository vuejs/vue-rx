# vue-rx [![Build Status](https://circleci.com/gh/vuejs/vue-rx/tree/master.svg?style=shield)](https://circleci.com/gh/vuejs/vue-rx/tree/master)

Simple [RxJS](https://github.com/Reactive-Extensions/RxJS) binding for Vue.js. It also supports subscriptions for generic observables that implement the `.subscribe` and `.unsubscribe` (or `.dispose`) interface. For example, you can use it to subscribe to `most.js` or Falcor streams, but some features require RxJS to work.

### Installation

#### NPM + ES2015

``` bash
npm install vue vue-rx rxjs --save
```

``` js
import Vue from 'vue'
import Rx from 'rxjs/Rx'
import VueRx from 'vue-rx'

// tada!
Vue.use(VueRx, Rx)
```

#### Tips for Reducing Bundle Size

In most cases, you probably don't need the full build of Rx. You can reduce the amount of code included in your bundle by doing the following:

``` js
import Vue from 'vue'
import VueRx from 'vue-rx'
import { Observable } from 'rxjs/Observable'
import { Subscription } from 'rxjs/Subscription' // Disposable if using RxJS4
import { Subject } from 'rxjs/Subject' // required for domStreams option

// tada!
Vue.use(VueRx, {
  Observable,
  Subscription,
  Subject
})
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

The observables are exposed as `vm.$observables`:

``` js
var vm = new Vue({
  subscriptions: {
    msg: messageObservable
  }
})

vm.$observables.msg.subscribe(msg => console.log(msg))
```

### `v-stream`: Streaming DOM Events

> New in 3.0

> This feature requires RxJS.

`vue-rx` provides the `v-stream` directive which allows you to stream DOM events to an Rx Subject. The syntax is similar to `v-on` where the directive argument is the event name, and the binding value is the target Rx Subject.

``` html
<button v-stream:click="plus$">+</button>
```

Note that you need to declare `plus$` as an instance of `Rx.Subject` on the vm instance before the render happens, just like you need to declare data. You can do that right in the `subscriptions` function:

``` js
new Vue({
  subscriptions () {
    // declare the receiving Subjects
    this.plus$ = new Rx.Subject()
    // ...then create subscriptions using the Subjects as source stream.
    // the source stream emits in the form of { event: HTMLEvent, data?: any }
    return {
      count: this.plus$.map(() => 1)
        .startWith(0)
        .scan((total, change) => total + change)
    }
  }
})
```

Or, use the `domStreams` convenience option:

``` js
new Vue({
  // requires `Rx` passed to Vue.use() to expose `Subject`
  domStreams: ['plus$'],
  subscriptions () {
    // use this.plus$
  }
})
```

Finally, you can pass additional data to the stream using the alternative syntax:

``` html
<button v-stream:click="{ subject: plus$, data: someData }">+</button>
```

This is useful when you need to pass along temporary variables like `v-for` iterators. You can get the data by simply plucking it from the source stream:

``` js
const plusData$ = this.plus$.pluck('data')
```

Starting in 3.1 you can also pass along extra options (passed along to native `addEventListener` as the 3rd argument):

``` html
<button v-stream:click="{
  subject: plus$,
  data: someData,
  options: { once: true, passive: true, capture: true }
}">+</button>
```

See [example](https://github.com/vuejs/vue-rx/blob/master/example/counter.html) for actual usage.

### Other API Methods

#### `$watchAsObservable(expOrFn, [options])`

> This feature requires RxJS.

This is a prototype method added to instances. You can use it to create an observable from a value watcher. The emitted value is in the format of `{ newValue, oldValue }`:

``` js
var vm = new Vue({
  data: {
    a: 1
  },
  subscriptions () {
    // declaratively map to another property with Rx operators
    return {
      aPlusOne: this.$watchAsObservable('a')
        .pluck('newValue')
        .map(a => a + 1)
    }
  }
})

// or produce side effects...
vm.$watchAsObservable('a')
  .subscribe(
    ({ newValue, oldValue }) => console.log('stream value', newValue, oldValue),
    err => console.error(err),
    () => console.log('complete')
  )
```

The optional `options` object accepts the same options as `vm.$watch`.

#### `$eventToObservable(event)`

> This feature requires RxJS.

Convert vue.$on (including lifecycle events) to Observables. The emitted value is in the format of `{ name, msg }`:

``` js
var vm = new Vue({
  created () {
    this.$eventToObservable('customEvent')
	  .subscribe((event) => console.log(event.name,event.msg))	
  }
})

// vm.$once vue-rx version
this.$eventToObservable('customEvent')
  .take(1)
  
// Another way to auto unsub:
let beforeDestroy$ = this.$eventToObservable('hook:beforeDestroy').take(1)
Rx.Observable.interval(500)
  .takeUntil(beforeDestroy$)
```

#### `$subscribeTo(observable, next, error, complete)`

This is a prototype method added to instances. You can use it to subscribe to an observable, but let VueRx manage the dispose/unsubscribe.

``` js
var vm = new Vue({
  mounted () {
    this.$subscribeTo(Rx.Observable.interval(1000), function (count) {
      console.log(count)
    })
  }
})
```

#### `$fromDOMEvent(selector, event)`

> This feature requires RxJS.

This is a prototype method added to instances. Use it to create an observable from DOM events within the instances' element. This is similar to `Rx.Observable.fromEvent`, but usable inside the `subscriptions` function even before the DOM is actually rendered.

`selector` is for finding descendant nodes under the component root element, if you want to listen to events from root element itself, pass `null` as first argument.

``` js
var vm = new Vue({
  subscriptions () {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').pluck('target', 'value')
    }
  }
})
```

### Caveats

You cannot use the `watch` option to watch subscriptions, because it is processed before the subscriptions are set up. But you can use `$watch` in the `created` hook instead.

### Example

See `/examples` for some simple examples.

### License

[MIT](http://opensource.org/licenses/MIT)
