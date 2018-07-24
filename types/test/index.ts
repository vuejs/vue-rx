import Vue from 'vue'
import VueRX from '../index'
import { interval }from 'rxjs'
import { pluck, map } from 'rxjs/operators'

Vue.use(VueRX)

const vm1 = new Vue({
  el: '#app',
  subscriptions: {
    msg: interval(100)
  }
})

vm1.$observables.msg.subscribe((msg: any) => console.log(msg))

Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: interval(100)
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
      aPlusOne: this.$watchAsObservable('a').pipe(
        pluck('newValue'),
        map(a => (a as number) + 1),
      )
    }
  }
})

// or produce side effects...
vm2.$watchAsObservable('a')
  .subscribe(
    ({ newValue, oldValue }: { newValue: number, oldValue: number }) => console.log('stream value', newValue, oldValue),
    (err: any) => console.error(err),
    () => console.log('complete')
  )


new Vue({
  created () {
    this.$eventToObservable('customEvent')
      .subscribe((event: { name: string, msg: string }) => console.log(event.name,event.msg))
  }
})

new Vue({
  mounted () {
    this.$subscribeTo(interval(1000), function (count) {
      console.log(count)
    })
  }
})

new Vue({
  subscriptions () {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').pipe(
        pluck('target', 'value')
      )
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
