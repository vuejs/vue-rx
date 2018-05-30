import { Observable, Subscription, NEVER } from 'rxjs'

export default function fromDOMEvent (selector, event) {
  if (typeof window === 'undefined') {
    // TODO(benlesh): I'm not sure if this is really what you want here,
    // but it's equivalent to what you were doing. You might want EMPTY
    return NEVER
  }

  const vm = this
  const doc = document.documentElement
  const obs$ = new Observable(observer => {
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
    return new Subscription(() => {
      doc.removeEventListener(event, listener)
    })
  })

  return obs$
}
