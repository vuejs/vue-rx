import Vue = require('vue')
import * as VueRX from '../index'
import * as Rx from 'rxjs/Rx'

Vue.use(VueRX, Rx)

var vm = new Vue({
  el: '#app',
  subscriptions: {
    msg: Rx.Observable.interval(100)
  }
})

vm.$observables.msg.subscribe(msg => console.log(msg))

Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: Rx.Observable.interval(100)
    }
  }
})

new Vue({
  domStreams: ['plus$']
})

var vm = new Vue({
  data: {
    a: 1
  },
  subscriptions () {
    // declaratively map to another property with Rx operators
    return {
      aPlusOne: this.$watchAsObservable('a')
        .pluck('newValue')
        .map((a: number) => a + 1)
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


var vm = new Vue({
  created () {
    this.$eventToObservable('customEvent')
    .subscribe((event) => console.log(event.name,event.msg))
  }
})

var vm = new Vue({
  mounted () {
    this.$subscribeTo(Rx.Observable.interval(1000), function (count) {
      console.log(count)
    })
  }
})

var vm = new Vue({
  subscriptions () {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').pluck('target', 'value')
    }
  }
})

var vm = new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod('submitHandler')
    }
  }
})

var vm = new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod('submitHandler')
    }
  }
})
