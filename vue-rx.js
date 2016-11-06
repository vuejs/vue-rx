(function () {
  function VueRx (Vue, Rx) {
    var warn = Vue.util.warn || function () {}

    function defineReactive (vm, key, val) {
      if (key in vm) {
        vm[key] = val
      } else {
        Vue.util.defineReactive(vm, key, val)
      }
    }

    function init () {
      var vm = this
      var dataFn = vm.$options.data
      var obs = vm.$options.subscriptions
      if (!obs) return

      // inject initialization into the data fn so that it is called
      // AFTER props and BEFORE watchers/computed are set up
      vm.$options.data = function () {
        if (typeof obs === 'function') {
          obs = obs.call(vm)
        }
        if (!obs) return
        vm._rxHandles = []
        Object.keys(obs).forEach(function (key) {
          defineReactive(vm, key, undefined)
          var ob = obs[key]
          if (!ob || typeof ob.subscribe !== 'function') {
            warn(
              'Invalid Observable found in subscriptions option with key "' + key + '".',
              vm
            )
            return
          }
          vm._rxHandles.push(obs[key].subscribe(function (value) {
            vm[key] = value
          }))
        })
        return dataFn ? dataFn() : {}
      }
    }

    Vue.mixin({
      init: init, // 1.x
      beforeCreate: init, // 2.0
      beforeDestroy: function () {
        if (this._rxHandles) {
          this._rxHandles.forEach(function (handle) {
            if (handle.dispose) {
              handle.dispose()
            } else if (handle.unsubscribe) {
              handle.unsubscribe()
            }
          })
        }
      }
    })

    Vue.prototype.$watchAsObservable = function (expOrFn, options) {
      if (!Rx) {
        warn(
          '$watchAsObservable requires passing the Rx to Vue.use() as the ' +
          'second argument.',
          this
        )
        return
      }

      var self = this

      var obs$ = Rx.Observable.create(function (observer) {
        // Create function to handle old and new Value
        function listener (newValue, oldValue) {
          observer.next({ oldValue: oldValue, newValue: newValue })
        }

        // Returns function which disconnects the $watch expression
        var disposable
        if (Rx.Subscription) { // Rx5
          disposable = new Rx.Subscription(self.$watch(expOrFn, listener, options))
        } else { // Rx4
          disposable = Rx.Disposable.create(self.$watch(expOrFn, listener, options))
        }

        return disposable
      }).publish().refCount()

      ;(self._rxHandles || (self._rxHandles = [])).push(obs$)

      return obs$
    }
  }

  // auto install
  if (typeof Vue !== 'undefined' && typeof Rx !== 'undefined') {
    Vue.use(VueRx, Rx)
  }

  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = VueRx
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return VueRx })
  } else if (typeof window !== 'undefined') {
    window.VueRx = VueRx
  }
})()
