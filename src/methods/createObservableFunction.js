import { Rx, hasRx, warn } from '../util'

/**
 * @name Vue.prototype.$createObservableFunction
 * @description Creates an observable from a given function name.
 * @param {String} functionName Function name
 * @param {Boolean} [passContext] Append the call context at the end of emit data?
 * @return {Observable} Hot stream
 */
export default function createObservableFunction (functionName, passContext) {
  if (!hasRx()) {
    return
  }
  const vm = this

  if (!Rx.Observable.prototype.share) {
    warn(
      `No 'share' operator. ` +
      `$createObservableFunction returns a shared hot observable. ` +
      `Try import 'rxjs/add/operator/share' for creating ${functionName}`,
      vm
    )
    return
  }

  if (vm[functionName] !== undefined) {
    warn(
      'Potential bug: ' +
      `Method ${functionName} already defined on vm and has been overwritten by $createObservableFunction.` +
      String(vm[functionName]),
      vm
    )
  }

  const creator = function (observer) {
    vm[functionName] = function () {
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
      delete vm[functionName]
    }
  }

  // Must be a hot stream otherwise function context may overwrite over and over again
  return Rx.Observable.create(creator).share()
}
