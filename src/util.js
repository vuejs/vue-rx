export let Vue
export let warn = function () {}

// NOTE(benlesh): the value of this method seems dubious now, but I'm not sure
// if this is a Vue convention I'm just not familiar with. Perhaps it would
// be better to just import and use Vue directly?
export function install (_Vue) {
  Vue = _Vue
  warn = Vue.util.warn || warn
}

// TODO(benlesh): as time passes, this should be updated to use RxJS 6.1's
// `isObservable` method. But wait until you're ready to drop support for Rx 5
export function isObservable (ob) {
  return ob && typeof ob.subscribe === 'function'
}

export function isObserver (subject) {
  return subject && (
    typeof subject.next === 'function'
  )
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
