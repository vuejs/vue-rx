(function () {
  function VueRx (Vue) {
    var VueVersion = Number(Vue.version && Vue.version.split('.')[0])
    var initHook = VueVersion && VueVersion > 1 ? 'beforeCreate' : 'init'

    var mixin = {
      beforeDestroy: function () {
        if (this._rxHandles) {
          this._rxHandles.forEach(function (handle) {
            handle.dispose()
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
            if (val.subscribe instanceof Function) {
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
  }

  // auto install
  if (typeof Vue !== 'undefined') {
    Vue.use(VueRx)
  }

  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = VueRx
  } else if(typeof define === 'function' && define.amd) {
    define(function () { return VueRx })
  } else if (typeof window !== 'undefined') {
    window.VueRx = VueRx
  }
})()
