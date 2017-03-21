export let Rx
export let Vue
export let warn = function () {}

export function install (_Vue, _Rx) {
  Rx = _Rx
  Vue = _Vue
  warn = Vue.util.warn || warn
}

export function hasRx (vm) {
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

export function isObservable (ob) {
  return ob && typeof ob.subscribe === 'function'
}

export function isSubject (subject) {
  return subject && (
    typeof subject.next === 'function' ||
    typeof subject.onNext === 'function'
  )
}

export function unsub (handle) {
  if (!handle) return
  if (handle.dispose) {
    handle.dispose()
  } else if (handle.unsubscribe) {
    handle.unsubscribe()
  }
}

export function getDisposable (target) {
  if (Rx.Subscription) { // Rx5
    return new Rx.Subscription(target)
  } else { // Rx4
    return Rx.Disposable.create(target)
  }
}

export function defineReactive (vm, key, val) {
  if (key in vm) {
    vm[key] = val
  } else {
    Vue.util.defineReactive(vm, key, val)
  }
}

export function getKey (binding) {
  return [binding.arg].concat(Object.keys(binding.modifiers)).join(':')
}
