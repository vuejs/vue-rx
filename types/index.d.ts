import Vue from 'vue'
import { WatchOptions } from 'vue'
import { Subscribable, PartialObserver } from 'rxjs'

export type Observables = Record<string, Subscribable<any>>

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
    $watchAsObservable(expr: string, options?: WatchOptions): Subscribable<WatchObservable<any>>
    $watchAsObservable<T>(fn: (this: this) => T, options?: WatchOptions): Subscribable<WatchObservable<T>>
    $eventToObservable(event: string): Subscribable<{name: string, msg: any}>
    $fromDOMEvent(selector: string | null, event: string): Subscribable<Event>
    $createObservableMethod(methodName: string): Subscribable<any>

    $subscribeTo<T>(
      observable: Subscribable<T>,
      observer?: PartialObserver<T>,
    ): void;

    $subscribeTo<T>(
      observable: Subscribable<T>,
      next: (value: T) => void,
      error?: (error: any) => void,
      complete?: () => void,
    ): void;
  }
}

export default function VueRx(V: typeof Vue): void
