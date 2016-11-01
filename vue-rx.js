(function () {
  function VueRx (Vue,Rx) {
    var VueVersion = Number(Vue.version && Vue.version.split('.')[0])
    var initHook = VueVersion && VueVersion > 1 ? 'beforeCreate' : 'init'

    var mixin = {
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
    }

    mixin[initHook] = function init () {
      var self = this
      var dataFn = this.$options.data
      if (dataFn) {
        this.$options.data = function () {
          var raw = dataFn()
          Object.keys(raw).forEach(function (key) {
            var val = raw[key]
            if (val && val.subscribe instanceof Function) {
              raw[key] = null
              ;(self._rxHandles || (self._rxHandles = []))
                .push(val.subscribe(function (value) {
                  self[key] = raw[key] = value
                }))
            }
          })
          return raw
        }
      }
    }

    Vue.mixin(mixin)


    Vue.prototype.$watchAsObservable = function (expOrFn,options) {
      var self = this;

      var obs$ = Rx.Observable.create(function (observer) {
        // Create function to handle old and new Value
        function listener (newValue, oldValue) {
          observer.next({ oldValue: oldValue, newValue: newValue });
        }

        // Returns function which disconnects the $watch expression
        var disposable;
        if(Rx.Subscription){//Rx5
          disposable = new Rx.Subscription(self.$watch(expOrFn,listener,options));
        }else{//Rx4
          disposable = Rx.Disposable.create(self.$watch(expOrFn,listener,options));
        }

        return disposable;
      }).publish().refCount();

      (self._rxHandles || (self._rxHandles = [])).push(obs$);

      return obs$;
    }

  }

  // auto install
  if (typeof Vue !== 'undefined') {
    Vue.use(VueRx,Rx)
  }

  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = VueRx
  } else if(typeof define === 'function' && define.amd) {
    define(function () { return VueRx })
  } else if (typeof window !== 'undefined') {
    window.VueRx = VueRx
  }
})()
