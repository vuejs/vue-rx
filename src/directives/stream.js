import { Rx, hasRx, isSubject, warn, getKey, unsub } from '../util'

export default {
  // Example ./example/counter_dir.html
  bind (el, binding, vnode) {
    if (!hasRx()) {
      return
    }

    let handle = binding.value
    const event = binding.arg
    const streamName = binding.expression
    const modifiers = binding.modifiers

    if (isSubject(handle)) {
      handle = { subject: handle }
    } else if (!handle || !isSubject(handle.subject)) {
      warn(
        'Invalid Subject found in directive with key "' + streamName + '".' +
        streamName + ' should be an instance of Rx.Subject or have the ' +
        'type { subject: Rx.Subject, data: any }.',
        vnode.context
      )
      return
    }

    const subject = handle.subject
    const next = (subject.next || subject.onNext).bind(subject)

    if (!modifiers.native && vnode.componentInstance) {
      handle.subscription = vnode.componentInstance.$eventToObservable(event).subscribe(e => {
        next({
          event: e,
          data: handle.data
        })
      })
    } else {
      if (!Rx.Observable.fromEvent) {
        warn(
          `No 'fromEvent' method on Observable class. ` +
          `v-stream directive requires Rx.Observable.fromEvent method. ` +
          `Try import 'rxjs/add/observable/fromEvent' for ${streamName}`,
          vnode.context
        )
        return
      }
      const fromEventArgs = handle.options ? [el, event, handle.options] : [el, event]
      handle.subscription = Rx.Observable.fromEvent(...fromEventArgs).subscribe(e => {
        next({
          event: e,
          data: handle.data
        })
      })

      // store handle on element with a unique key for identifying
      // multiple v-stream directives on the same node
      ;(el._rxHandles || (el._rxHandles = {}))[getKey(binding)] = handle
    }
  },

  update (el, binding) {
    const handle = binding.value
    const _handle = el._rxHandles && el._rxHandles[getKey(binding)]
    if (_handle && handle && isSubject(handle.subject)) {
      _handle.data = handle.data
    }
  },

  unbind (el, binding) {
    const key = getKey(binding)
    const handle = el._rxHandles && el._rxHandles[key]
    if (handle) {
      unsub(handle.subscription)
      el._rxHandles[key] = null
    }
  }
}
