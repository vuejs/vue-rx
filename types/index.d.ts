import Vue = require('vue')
import { WatchOptions } from 'vue'
import { Observable } from 'rxjs/Observable'

export type Observables = Record<string, Observable<any>>
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    subscriptions?: Observables | ((this: V) => Observables)
    domStreams?: string[]
  }
}

declare module "vue/types/vue" {
  interface Vue {
    $observables: Observables;
    $watchAsObservable(exprOrFn: string | Function, options?: WatchOptions): Observable<any>
    $eventToObservable(event: string): Observable<any>
    $subscribeTo<T>(
      observable: Observable<T>,
      next: (t: T) => void,
      error: (e: any) => void,
      complete: () => void): void
    $fromDOMEvent(selector: string, event: string): Observable<any>
    $createObservableMethod(methodName: string): Observable<any>
  }
}

export declare function install(V: typeof Vue): void
