import { Subscription } from 'rxjs'

export default function subscribeTo (observable, next, error, complete) {
  const subscription = observable.subscribe(next, error, complete)
  ;(this._subscription || (this._subscription = new Subscription())).add(subscription)
  return subscription
}
