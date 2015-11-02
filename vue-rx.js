(function () {

  var installed = false

  function VueRx (Vue, Rx) {
    if (installed) {
      return
    }

    if (!Rx) {
      if (typeof window !== 'undefined' && window.Rx) {
        Rx = window.Rx
      } else {
        throw new Error(
          'Make sure to pass in Rx if it is not available globally: Vue.use(VueRx, Rx)'
        )
      }
    }

    installed = true

    Vue.mixin({
      init: function () {
        var self = this
        var dataFn = this.$options.data
        if (dataFn) {
          this.$options.data = function () {
            var raw = dataFn()
            Object.keys(raw).forEach(function (key) {
              var val = raw[key]
              if (val instanceof Rx.Observable) {
                raw[key] = null
                ;(self._rxHandles || (self._rxHandles = []))
                  .push(val.subscribe(function (value) {
                    self[key] = value
                  }))
              }
            })
            return raw
          }
        }
      },
      beforeDestroy: function () {
        if (this._rxHandles) {
          this._rxHandles.forEach(function (handle) {
            handle.dispose()
          })
        }
      }
    })
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
