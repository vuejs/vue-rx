/* eslint-env jest */

'use strict'

const Vue = require('vue/dist/vue.js')
const VueRx = require('../dist/vue-rx.js')

// library
const { Observable } = require('rxjs')
const { map, scan, pluck, merge, tap, filter, startWith } = require('rxjs/operators')

Vue.config.productionTip = false
Vue.use(VueRx)

const nextTick = Vue.nextTick

function mock () {
  let observer
  const observable = new Observable(_observer => {
    observer = _observer
  })
  return {
    ob: observable,
    next: val => observer.next(val)
  }
}

function trigger (target, event) {
  var e = document.createEvent('HTMLEvents')
  e.initEvent(event, true, true)
  target.dispatchEvent(e)
}

function click (target) {
  trigger(target, 'click')
}

test('expose $observables', () => {
  const { ob, next } = mock()

  const vm = new Vue({
    subscriptions: {
      hello: ob.pipe(
        startWith(0),
      )
    }
  })

  const results = []
  vm.$observables.hello.subscribe(val => {
    results.push(val)
  })

  next(1)
  next(2)
  next(3)
  expect(results).toEqual([0, 1, 2, 3])
})

test('bind subscriptions to render', done => {
  const { ob, next } = mock()

  const vm = new Vue({
    subscriptions: {
      hello: ob.pipe(startWith('foo'))
    },
    render (h) {
      return h('div', this.hello)
    }
  }).$mount()

  expect(vm.$el.textContent).toBe('foo')

  next('bar')
  nextTick(() => {
    expect(vm.$el.textContent).toBe('bar')
    done()
  })
})

test('subscriptions() has access to component state', () => {
  const { ob } = mock()

  const vm = new Vue({
    data: {
      foo: 'FOO'
    },
    props: ['bar'],
    propsData: {
      bar: 'BAR'
    },
    subscriptions () {
      return {
        hello: ob.pipe(startWith(this.foo + this.bar))
      }
    },
    render (h) {
      return h('div', this.hello)
    }
  }).$mount()

  expect(vm.$el.textContent).toBe('FOOBAR')
})

test('subscriptions() can throw error properly', done => {
  const { ob, next } = mock()
  let thrownError

  const vm = new Vue({
    subscriptions () {
      return {
        num: ob.pipe(
          startWith(1),
          map(n => n.toFixed()),
          tap({
            error (err) {
              thrownError = err
            }
          })
        )
      }
    },
    render (h) {
      return h('div', this.num)
    }
  }).$mount()

  nextTick(() => {
    next(null)

    nextTick(() => {
      expect(thrownError).toBeDefined()
      expect(vm.$el.textContent).toBe('1')
      done()
    })
  })
})

test('v-stream directive (basic)', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button v-stream:click="click$">+</button>
      </div>
    `,
    domStreams: ['click$'],
    subscriptions () {
      return {
        count: this.click$.pipe(
          map(() => 1),
          startWith(0),
          scan((total, change) => total + change),
        )
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    done()
  })
})

test('v-stream directive (with .native modify)', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <my-button id="btn-native" v-stream:click.native="clickNative$">+</my-button>
        <my-button id="btn" v-stream:click="click$">-</my-button>
      </div>
    `,
    components: {
      myButton: {
        template: '<button>MyButton</button>'
      }
    },
    domStreams: ['clickNative$', 'click$'],
    subscriptions () {
      return {
        count: this.clickNative$.pipe(
          merge(this.click$),
          filter(e => e.event.target && e.event.target.id === 'btn-native'),
          map(() => 1),
          startWith(0),
          scan((total, change) => total + change),
        )
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('#btn'))
  click(vm.$el.querySelector('#btn'))
  click(vm.$el.querySelector('#btn-native'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    done()
  })
})

test('v-stream directive (with .stop, .prevent modify)', done => {
  const vm = new Vue({
    template: `
      <form>
        <span>{{stoped}} {{prevented}}</span>
        <button id="btn-stop" v-stream:click.stop="clickStop$">Stop</button>
        <button id="btn-prevent" type="submit" v-stream:click.prevent="clickPrevent$">Submit</button>
      </form>
    `,
    domStreams: ['clickStop$', 'clickPrevent$'],
    subscriptions () {
      return {
        stoped: this.clickStop$.pipe(
          map(x => x.event.cancelBubble),
        ),
        prevented: this.clickPrevent$.pipe(
          map(x => x.event.defaultPrevented),
        )
      }
    }
  }).$mount()

  click(vm.$el.querySelector('#btn-stop'))
  click(vm.$el.querySelector('#btn-prevent'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('true true')
    done()
  })
})

test('v-stream directive (with data)', done => {
  const customButton = {
    name: 'custom-button',
    template: `<button id="custom-button" @click="$emit('click-custom')"><slot/></button>`
  }

  const vm = new Vue({
    components: {
      customButton
    },
    data: {
      delta: -1
    },
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button id="native-button" v-stream:click="{ subject: click$, data: delta }">+</button>
        <custom-button v-stream:click-custom="{ subject: click$, data: delta }">+</custom-button>
      </div>
    `,
    domStreams: ['click$'],
    subscriptions () {
      return {
        count: this.click$.pipe(
          pluck('data'),
          startWith(0),
          scan((total, change) => total + change),
        )
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('#custom-button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('-1')
    vm.delta = 1
    nextTick(() => {
      click(vm.$el.querySelector('#native-button'))
      nextTick(() => {
        expect(vm.$el.querySelector('span').textContent).toBe('0')
        done()
      })
    })
  })
})

test('v-stream directive (multiple bindings on same node)', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button
          v-stream:click="{ subject: plus$, data: 1 }"
          v-stream:keyup="{ subject: plus$, data: -1 }">+</button>
      </div>
    `,
    domStreams: ['plus$'],
    subscriptions () {
      return {
        count: this.plus$.pipe(
          pluck('data'),
          startWith(0),
          scan((total, change) => total + change),
        )
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    trigger(vm.$el.querySelector('button'), 'keyup')
    nextTick(() => {
      expect(vm.$el.querySelector('span').textContent).toBe('0')
      done()
    })
  })
})

test('$fromDOMEvent()', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button>+</button>
      </div>
    `,
    subscriptions () {
      const click$ = this.$fromDOMEvent('button', 'click')
      return {
        count: click$.pipe(
          map(() => 1),
          startWith(0),
          scan((total, change) => total + change),
        )
      }
    }
  }).$mount()

  document.body.appendChild(vm.$el)
  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    done()
  })
})

test('$watchAsObservable()', done => {
  const vm = new Vue({
    data: {
      count: 0
    }
  })

  const results = []
  vm.$watchAsObservable('count').subscribe(change => {
    results.push(change)
  })

  vm.count++
  nextTick(() => {
    expect(results).toEqual([{ newValue: 1, oldValue: 0 }])
    vm.count++
    nextTick(() => {
      expect(results).toEqual([
        { newValue: 1, oldValue: 0 },
        { newValue: 2, oldValue: 1 }
      ])
      done()
    })
  })
})

test('$subscribeTo()', () => {
  const { ob, next } = mock()
  const results = []
  const vm = new Vue({
    created () {
      this.$subscribeTo(ob, count => {
        results.push(count)
      })
    }
  })

  next(1)
  expect(results).toEqual([1])

  vm.$destroy()
  next(2)
  expect(results).toEqual([1]) // should not trigger anymore
})

test('$eventToObservable()', done => {
  let calls = 0
  const vm = new Vue({
    created () {
      this.$eventToObservable('ping')
        .subscribe(function (event) {
          expect(event.name).toEqual('ping')
          expect(event.msg).toEqual('ping message')
          calls++
        })
    }
  })
  vm.$emit('ping', 'ping message')

  nextTick(() => {
    vm.$destroy()
    // Should not emit
    vm.$emit('pong', 'pong message')
    expect(calls).toEqual(1)
    done()
  })
})

test('$eventToObservable() with lifecycle hooks', done => {
  const vm = new Vue({
    created () {
      this.$eventToObservable('hook:beforeDestroy')
        .subscribe(() => {
          done()
        })
    }
  })
  nextTick(() => {
    vm.$destroy()
  })
})

test('$createObservableMethod() with no context', done => {
  const vm = new Vue({
    created () {
      this.$createObservableMethod('add')
        .subscribe(function (param) {
          expect(param).toEqual('hola')
          done()
        })
    }
  })
  nextTick(() => {
    vm.add('hola')
  })
})

test('$createObservableMethod() with muli params & context', done => {
  const vm = new Vue({
    created () {
      this.$createObservableMethod('add', true)
        .subscribe(function (param) {
          expect(param[0]).toEqual('hola')
          expect(param[1]).toEqual('mundo')
          expect(param[2]).toEqual(vm)
          done()
        })
    }
  })
  nextTick(() => {
    vm.add('hola', 'mundo')
  })
})

test('observableMethods mixin', done => {
  const vm = new Vue({
    observableMethods: ['add'],
    created () {
      this.add$
        .subscribe(function (param) {
          expect(param[0]).toEqual('Qué')
          expect(param[1]).toEqual('tal')
          done()
        })
    }
  })
  nextTick(() => {
    vm.add('Qué', 'tal')
  })
})

test('observableMethods mixin', done => {
  const vm = new Vue({
    observableMethods: { 'add': 'plus$' },
    created () {
      this.plus$
        .subscribe(function (param) {
          expect(param[0]).toEqual('Qué')
          expect(param[1]).toEqual('tal')
          done()
        })
    }
  })
  nextTick(() => {
    vm.add('Qué', 'tal')
  })
})
