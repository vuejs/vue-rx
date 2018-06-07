# vue-rx [![Build Status](https://circleci.com/gh/vuejs/vue-rx/tree/master.svg?style=shield)](https://circleci.com/gh/vuejs/vue-rx/tree/master)

English | [简体中文](README-CN.md)

[RxJS v6](https://github.com/ReactiveX/rxjs) integration for Vue.js.

> **BREAKING CHANGES from 5.0**
> - vue-rx v6 now only works with RxJS v6 by default. If you want to keep using RxJS v5 style code, install `rxjs-compat`.

### Installation

#### NPM + ES2015

**`rxjs` is required as a peer dependency.**

``` bash
npm install vue vue-rx rxjs --save
```

``` js
import Vue from 'vue'
import VueRx from 'vue-rx'

Vue.use(VueRx)
```

When bundling via webpack, `dist/vue-rx.esm.js` is used by default. It imports the minimal amount of Rx operators and ensures small bundle sizes.

#### Global Script

To use in a browser environment, use the UMD build `dist/vue-rx.js`. When in a browser environment, the UMD build assumes `window.rxjs` to be already present, so make sure to include `vue-rx.js` after Vue.js and RxJS. It also installs itself automatically if `window.Vue` is present.

Example:

``` html
<script src="https://unpkg.com/rxjs/bundles/rxjs.umd.js"></script>
<script src="https://unpkg.com/vue/dist/vue.js"></script>
<script src="../dist/vue-rx.js"></script>
```

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
import { Observable } from 'rxjs'

Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: new Observable(...)
    }
  }
})
```

The observables are exposed as `vm.$observables`:

``` js
const vm = new Vue({
  subscriptions: {
    msg: messageObservable
  }
})

vm.$observables.msg.subscribe(msg => console.log(msg))
```

### `v-stream`: Streaming DOM Events

`vue-rx` provides the `v-stream` directive which allows you to stream DOM events to an Rx Subject. The syntax is similar to `v-on` where the directive argument is the event name, and the binding value is the target Rx Subject.

``` html
<button v-stream:click="plus$">+</button>
```

Note that you need to declare `plus$` as an instance of `rxjs.Subject` on the vm instance before the render happens, just like you need to declare data. You can do that right in the `subscriptions` function:

``` js
import { Subject } from 'rxjs'
import { map, startWith, scan } from 'rxjs/operators'

new Vue({
  subscriptions () {
    // declare the receiving Subjects
    this.plus$ = new Subject()
    // ...then create subscriptions using the Subjects as source stream.
    // the source stream emits in the format of `{ event: HTMLEvent, data?: any }`
    return {
      count: this.plus$.pipe(
        map(() => 1),
        startWith(0),
        scan((total, change) => total + change)
      )
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
const plusData$ = this.plus$.pipe(pluck('data'))
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

### `v-stream`: Streaming Custom Events from Child Components

Similar to streaming `DOM` events, `v-stream` can be used on components as well and will create observables from custom events emitted by the child component. It works similar to `v-on`:

```html
<div>
  <!-- Custom component -->
  <pagination v-on:change="pageChanged()"></pagination>

  <!-- v-stream with custom component -->
  <pagination v-stream:change="pageChange$"></pagination>
</div>
```

### Other API Methods

#### `$watchAsObservable(expOrFn, [options])`

This is a prototype method added to instances. You can use it to create an observable from a value watcher. The emitted value is in the format of `{ newValue, oldValue }`:

``` js
import { pluck, map } from 'rxjs/operators'

const vm = new Vue({
  data: {
    a: 1
  },
  subscriptions () {
    // declaratively map to another property with Rx operators
    return {
      aPlusOne: this.$watchAsObservable('a').pipe(
        pluck('newValue'),
        map(a => a + 1)
      )
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

Convert vue.$on (including lifecycle events) to Observables. The emitted value is in the format of `{ name, msg }`:

``` js
import { interval } from 'rxjs'
import { take, takeUntil } from 'rxjs/operators'

const vm = new Vue({
  created () {
    this.$eventToObservable('customEvent')
	  .subscribe((event) => console.log(event.name,event.msg))
  }
})

// vm.$once vue-rx version
this.$eventToObservable('customEvent').pipe(
  take(1)
)

// Another way to auto unsub:
let beforeDestroy$ = this.$eventToObservable('hook:beforeDestroy').pipe(take(1))

interval(500)
  .pipe(takeUntil(beforeDestroy$))
```

#### `$subscribeTo(observable, next, error, complete)`

This is a prototype method added to instances. You can use it to subscribe to an observable, but let VueRx manage the dispose/unsubscribe.

``` js
import { interval } from 'rxjs'

const vm = new Vue({
  mounted () {
    this.$subscribeTo(interval(1000), function (count) {
      console.log(count)
    })
  }
})
```

#### `$fromDOMEvent(selector, event)`

This is a prototype method added to instances. Use it to create an observable from DOM events within the instances' element. This is similar to `Rx.Observable.fromEvent`, but usable inside the `subscriptions` function even before the DOM is actually rendered.

`selector` is for finding descendant nodes under the component root element, if you want to listen to events from root element itself, pass `null` as first argument.

``` js
import { pluck } from 'rxjs/operators'

const vm = new Vue({
  subscriptions () {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').pipe(
        pluck('target', 'value')
      )
    }
  }
})
```

#### `$createObservableMethod(methodName)`

Convert function calls to observable sequence which emits the call arguments.

This is a prototype method added to instances. Use it to create a shared hot observable from a function name. The function will be assigned as a vm method.

```html
<custom-form :onSubmit="submitHandler"></custom-form>
```
``` js
const vm = new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod('submitHandler')
    }
  }
})
```

You can use the `observableMethods` option to make it more declarative:

``` js
new Vue({
  observableMethods: {
    submitHandler: 'submitHandler$'
    // or with Array shothand: ['submitHandler']
  }
})
```

The above will automatically create two things on the instance:

1. A `submitHandler` method which can be bound to in template with `v-on`;
2. A `submitHandler$` observable which will be the stream emitting calls to `submitHandler`.

[example](https://github.com/vuejs/vue-rx/blob/master/example/counter-function.html)

### Caveats

You cannot use the `watch` option to watch subscriptions, because it is processed before the subscriptions are set up. But you can use `$watch` in the `created` hook instead.

### Example

See `/examples` for some simple examples.

### License

[MIT](http://opensource.org/licenses/MIT)
