import Vue from 'vue'
import { WatchOptions } from 'vue'
import { Observable, PartialObserver } from 'rxjs'

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
    $fromDOMEvent(selector: string | null, event: string): Observable<Event>
    $createObservableMethod(methodName: string): Observable<any>

    $subscribeTo<T>(
      observable: Observable<T>,
      observer?: PartialObserver<T>,
    ): void;

    $subscribeTo<T>(
      observable: Observable<T>,
      next: (value: T) => void,
      error?: (error: any) => void,
      complete?: () => void,
    ): void;
  }
}

export default function VueRx(V: typeof Vue): void
