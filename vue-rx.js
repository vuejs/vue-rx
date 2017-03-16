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
    function isObservable(ob) {
      return ob && typeof ob.subscribe === 'function';
	}
    function isSubject(subject) {
      return subject && (typeof subject.next === 'function' || typeof subject.onNext === 'function');
    }
    function unsub(handle) {
      if(!handle){return}
      if (handle.dispose) {
        handle.dispose()
      } else if (handle.unsubscribe) {
        handle.unsubscribe()
      }
    }
    function getDisposable(target) {
      if (Rx.Subscription) { // Rx5
        return new Rx.Subscription(target)
      } else { // Rx4
        return Rx.Disposable.create(target)
      }
    }

    function defineReactive (vm, key, val) {
      if (key in vm) {
        vm[key] = val
      } else {
        Vue.util.defineReactive(vm, key, val)
      }
    }

    Vue.mixin({
      created: function init () {
        var vm = this
        var obs = vm.$options.subscriptions
        if (typeof obs === 'function') {
          obs = obs.call(vm)
        }
        if (!obs) return
        vm.$observables = {}
        vm._obSubscriptions = []
        Object.keys(obs).forEach(function (key) {
          defineReactive(vm, key, undefined)
          var ob = vm.$observables[key] = obs[key]
          if (!isObservable(ob)) {
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
      },
      beforeDestroy: function () {
        if (this._obSubscriptions) {
          this._obSubscriptions.forEach(unsub)
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
        var disposable = getDisposable(unwatch);

        return disposable
      })

      ;(vm._obSubscriptions || (vm._obSubscriptions = [])).push(obs$)
      return obs$
    }

    Vue.prototype.$fromDOMEvent = function (selector, event) {
      if (!hasRx()) {
        return
      }
      if (typeof window === 'undefined') {
        return Rx.Observable.create(function () {})
      }

      var vm = this
      var doc = document.documentElement
      var obs$ = Rx.Observable.create(function (observer) {
        function listener (e) {
          if (!vm.$el) return;
          if (selector === null && vm.$el === e.target) return observer.next(e)
          var els = vm.$el.querySelectorAll(selector);
          var el = e.target;
          for (var i = 0, len = els.length; i < len; i++) {
            if (els[i] === el) return observer.next(e)
          }
        }
        doc.addEventListener(event, listener)
        function unwatch () {
          doc.removeEventListener(event, listener)
        }
        // Returns function which disconnects the $watch expression
        var disposable = getDisposable(unwatch)
        return disposable
      })

      ;(vm._obSubscriptions || (vm._obSubscriptions = [])).push(obs$)
      return obs$
    }


    Vue.directive('stream', {
      //Example ./example/counter_dir.html
      bind: function (el, binding, vnode) {
        if (!hasRx()) {
          return
        }
        var streamName = binding.arg;
        var vmStream = vnode.context.$observables[streamName] || vnode.context[streamName];
        var eventNames = Object.keys(binding.modifiers);

        if(isSubject(vmStream)){
          var onNext = (vmStream.next || vmStream.onNext).bind(vmStream); //Rx4 Rx5
          binding.obs$ = eventNames.map(function (evtName) {
              return Rx.Observable.fromEvent(el,evtName)
                  .subscribe(function (evt) {
                    onNext({
                      event:evt,
                      data:binding.value
                    });
                  });
          })
        }else{
          warn(
              'Invalid Subject found in directive with key "' + streamName + '".' + 'Please declare ' + streamName + ' as an new Rx.Subject'
          )
        }
      },
      unbind: function (el, binding, vnode) {
        if(Array.isArray(binding.obs$)){
          binding.obs$.forEach(function (ob) {
            unsub(ob)
          })
        }
      }
    });




    Vue.prototype.$subscribeTo = function(observable, next, error, complete) {
      var obs$ = observable.subscribe(next, error, complete)
      ;(this._obSubscriptions || (this._obSubscriptions = [])).push(obs$)
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
