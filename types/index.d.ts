import Vue from 'vue'
import { WatchOptions } from 'vue'
import { Observable } from 'rxjs'

export type Observables = Record<string, Observable<any>>
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    subscriptions?: Observables | ((this: V) => Observables)
    domStreams?: string[]
    observableMethods?: string[] | Record<string, string>
  }
}

export interface WatchObservable<T> {
  newValue: T
  oldValue: T
}
declare module "vue/types/vue" {
  interface Vue {
    $observables: Observables;
    $watchAsObservable(expr: string, options?: WatchOptions): Observable<WatchObservable<any>>
    $watchAsObservable<T>(fn: (this: this) => T, options?: WatchOptions): Observable<WatchObservable<T>>
    $eventToObservable(event: string): Observable<{name: string, msg: any}>
    $subscribeTo<T>(
      observable: Observable<T>,
      next: (t: T) => void,
      error?: (e: any) => void,
      complete?: () => void): void
    $fromDOMEvent(selector: string | null, event: string): Observable<Event>
    $createObservableMethod(methodName: string): Observable<any>
  }
}

export default function VueRx(V: typeof Vue): void
