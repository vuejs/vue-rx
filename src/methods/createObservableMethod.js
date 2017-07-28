import { Rx, hasRx, warn } from '../util'

/**
 * @name Vue.prototype.$createObservableMethod
 * @description Creates an observable from a given function name.
 * @param {String} methodName Function name
 * @param {Boolean} [passContext] Append the call context at the end of emit data?
 * @return {Observable} Hot stream
 */
export default function createObservableMethod (methodName, passContext) {
  if (!hasRx()) {
    return
  }
  const vm = this

  if (!Rx.Observable.prototype.share) {
    warn(
      `No 'share' operator. ` +
      `$createObservableMethod returns a shared hot observable. ` +
      `Try import 'rxjs/add/operator/share' for creating ${methodName}`,
      vm
    )
    return
  }

  if (vm[methodName] !== undefined) {
    warn(
      'Potential bug: ' +
      `Method ${methodName} already defined on vm and has been overwritten by $createObservableMethod.` +
      String(vm[methodName]),
      vm
    )
  }

  const creator = function (observer) {
    vm[methodName] = function () {
      const args = Array.from(arguments)
      if (passContext) {
        args.push(this)
        observer.next(args)
      } else {
        if (args.length <= 1) {
          observer.next(args[0])
        } else {
          observer.next(args)
        }
      }
    }
    return function () {
      delete vm[methodName]
    }
  }

  // Must be a hot stream otherwise function context may overwrite over and over again
  return Rx.Observable.create(creator).share()
}
