import { isObserver, warn, getKey } from '../util'
import { fromEvent } from 'rxjs'

export default {
  // Example ./example/counter_dir.html
  bind (el, binding, vnode) {
    let handle = binding.value
    const event = binding.arg
    const streamName = binding.expression
    const modifiers = binding.modifiers

    if (isObserver(handle)) {
      handle = { subject: handle }
    } else if (!handle || !isObserver(handle.subject)) {
      warn(
        'Invalid Subject found in directive with key "' + streamName + '".' +
        streamName + ' should be an instance of Subject or have the ' +
        'type { subject: Subject, data: any }.',
        vnode.context
      )
      return
    }

    const modifiersFuncs = {
      stop: e => e.stopPropagation(),
      prevent: e => e.preventDefault()
    }

    var modifiersExists = Object.keys(modifiersFuncs).filter(
      key => modifiers[key]
    )

    const subject = handle.subject
    const next = (subject.next || subject.onNext).bind(subject)

    if (!modifiers.native && vnode.componentInstance) {
      handle.subscription = vnode.componentInstance.$eventToObservable(event).subscribe(e => {
        modifiersExists.forEach(mod => modifiersFuncs[mod](e))
        next({
          event: e,
          data: handle.data
        })
      })
    } else {
      const fromEventArgs = handle.options ? [el, event, handle.options] : [el, event]
      handle.subscription = fromEvent(...fromEventArgs).subscribe(e => {
        modifiersExists.forEach(mod => modifiersFuncs[mod](e))
        next({
          event: e,
          data: handle.data
        })
      })
    }

    // store handle on element with a unique key for identifying
    // multiple v-stream directives on the same node
    ;(el._rxHandles || (el._rxHandles = {}))[getKey(binding)] = handle
  },

  update (el, binding) {
    const handle = binding.value
    const _handle = el._rxHandles && el._rxHandles[getKey(binding)]
    if (_handle && handle && isObserver(handle.subject)) {
      _handle.data = handle.data
    }
  },

  unbind (el, binding) {
    const key = getKey(binding)
    const handle = el._rxHandles && el._rxHandles[key]
    if (handle) {
      if (handle.subscription) {
        handle.subscription.unsubscribe()
      }
      el._rxHandles[key] = null
    }
  }
}
