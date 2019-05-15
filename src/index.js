/* global Vue */

import { install } from './util'
import rxMixin from './mixin'
import streamDirective from './directives/stream'
import watchAsObservable from './methods/watchAsObservable'
import fromDOMEvent from './methods/fromDOMEvent'
import subscribeTo from './methods/subscribeTo'
import eventToObservable from './methods/eventToObservable'
import createObservableMethod from './methods/createObservableMethod'

export default function VueRx (Vue) {
  install(Vue)
  Vue.mixin(rxMixin)
  Vue.directive('stream', streamDirective)
  Vue.prototype.$watchAsObservable = watchAsObservable
  Vue.prototype.$fromDOMEvent = fromDOMEvent
  Vue.prototype.$subscribeTo = subscribeTo
  Vue.prototype.$eventToObservable = eventToObservable
  Vue.prototype.$createObservableMethod = createObservableMethod
  Vue.config.optionMergeStrategies.subscriptions = Vue.config.optionMergeStrategies.data
}

// auto install
if (typeof Vue !== 'undefined') {
  Vue.use(VueRx)
}
