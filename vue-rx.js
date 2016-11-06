(function () {
  function VueRx (Vue, Rx) {
    var warn = Vue.util.warn || function () {}

    function hasRx (vm) {
      if (!Rx) {
        warn(
          '$watchAsObservable requires Rx to be present globally or ' +
          'be passed to Vue.use() as the second argument.',
          vm
        )
        return false
      }
      return true
    }

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
        vm._obSubscriptions = []
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
          vm._obSubscriptions.push(obs[key].subscribe(function (value) {
            vm[key] = value
          }))
        })
        return dataFn ? dataFn() : {}
      }
    }

    Vue.mixin({
      init: init, // 1.x
      beforeCreate: init, // 2.0,
      beforeDestroy: function () {
        if (this._obSubscriptions) {
          this._obSubscriptions.forEach(function (handle) {
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
      if (!hasRx()) {
        return
      }

      var vm = this
      var obs$ = Rx.Observable.create(function (observer) {
        var _unwatch
        function watch () {
          _unwatch = vm.$watch(expOrFn, function (newValue, oldValue) {
            observer.next({ oldValue: oldValue, newValue: newValue })
          }, options)
        }
        function unwatch () {
          _unwatch && _unwatch()
        }

        // if $watchAsObservable is called inside the subscriptions function,
        // because data hasn't been observed yet, the watcher will not work.
        // in that case, wait until created hook to watch.
        if (vm._data) {
          watch()
        } else {
          vm.$once('hook:created', watch)
        }

        // Returns function which disconnects the $watch expression
        var disposable
        if (Rx.Subscription) { // Rx5
          disposable = new Rx.Subscription(unwatch)
        } else { // Rx4
          disposable = Rx.Disposable.create(unwatch)
        }
        return disposable
      }).publish().refCount()

      ;(vm._obSubscriptions || (vm._obSubscriptions = [])).push(obs$)
      return obs$
    }

    Vue.prototype.$fromDOMEvent = function (selector, event) {
      if (!hasRx()) {
        return
      }
      if (typeof window === 'undefined') {
        return Rx.Observable.empty()
      }

      var vm = this
      var doc = document.documentElement
      var obs$ = Rx.Observable.create(function (observer) {
        function listener (e) {
          if (vm.$el && vm.$el.querySelector(selector) === e.target) {
            observer.next(e)
          }
        }
        doc.addEventListener(event, listener)
        function unwatch () {
          doc.removeEventListener(event, listener)
        }
        // Returns function which disconnects the $watch expression
        var disposable
        if (Rx.Subscription) { // Rx5
          disposable = new Rx.Subscription(unwatch)
        } else { // Rx4
          disposable = Rx.Disposable.create(unwatch)
        }
        return disposable
      }).publish().refCount()

      ;(vm._obSubscriptions || (vm._obSubscriptions = [])).push(obs$)
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
