import { Rx, hasRx, getDisposable } from '../util'

export default function fromDOMEvent (selector, event) {
  if (!hasRx()) {
    return
  }
  if (typeof window === 'undefined') {
    return Rx.Observable.create(() => {})
  }

  const vm = this
  const doc = document.documentElement
  const obs$ = Rx.Observable.create(observer => {
    function listener (e) {
      if (!vm.$el) return
      if (selector === null && vm.$el === e.target) return observer.next(e)
      var els = vm.$el.querySelectorAll(selector)
      var el = e.target
      for (var i = 0, len = els.length; i < len; i++) {
        if (els[i] === el) return observer.next(e)
      }
    }
    doc.addEventListener(event, listener)
    // Returns function which disconnects the $watch expression
    return getDisposable(() => {
      doc.removeEventListener(event, listener)
    })
  })

  return obs$
}
