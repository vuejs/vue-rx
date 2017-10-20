import Vue from 'vue'
import * as VueRX from '../index'
import * as Rx from 'rxjs/Rx'

Vue.use(VueRX, Rx)

const vm1 = new Vue({
  el: '#app',
  subscriptions: {
    msg: Rx.Observable.interval(100)
  }
})

vm1.$observables.msg.subscribe(msg => console.log(msg))

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

const vm2 = new Vue({
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
vm2.$watchAsObservable('a')
  .subscribe(
    ({ newValue, oldValue }) => console.log('stream value', newValue, oldValue),
    err => console.error(err),
    () => console.log('complete')
  )


new Vue({
  created () {
    this.$eventToObservable('customEvent')
    .subscribe((event) => console.log(event.name,event.msg))
  }
})

new Vue({
  mounted () {
    this.$subscribeTo(Rx.Observable.interval(1000), function (count) {
      console.log(count)
    })
  }
})

new Vue({
  subscriptions () {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').pluck('target', 'value')
    }
  }
})

new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod('submitHandler')
    }
  }
})

new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod('submitHandler')
    }
  }
})
