const Vue = require('vue/dist/vue.js')
const VueRx = require('../dist/vue-rx.js')
const Rx = require('rxjs')

const miniRx = {
  Observable: Rx.Observable,
  Subscription: Rx.Subscription,
  Subject: Rx.Subject
}

Vue.config.productionTip = false
Vue.use(VueRx, miniRx)

const nextTick = Vue.nextTick

function mock () {
  let observer
  const observable = Rx.Observable.create(_observer => {
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
      hello: ob.startWith(0)
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
      hello: ob.startWith('foo')
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
  const { ob, next } = mock()

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
        hello: ob.startWith(this.foo + this.bar)
      }
    },
    render (h) {
      return h('div', this.hello)
    }
  }).$mount()

  expect(vm.$el.textContent).toBe('FOOBAR')
})

test('v-stream directive (basic)', done => {
  const { ob, next } = mock()

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
        count: this.click$.map(() => 1)
          .startWith(0)
          .scan((total, change) => total + change)
      }
    },
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    done()
  })
})

test('v-stream directive (with data)', done => {
  const { ob, next } = mock()

  const vm = new Vue({
    data: {
      delta: -1
    },
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button v-stream:click="{ subject: click$, data: delta }">+</button>
      </div>
    `,
    domStreams: ['click$'],
    subscriptions () {
      return {
        count: this.click$.pluck('data')
          .startWith(0)
          .scan((total, change) => total + change)
      }
    },
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('-1')
    vm.delta = 1
    nextTick(() => {
      click(vm.$el.querySelector('button'))
      nextTick(() => {
        expect(vm.$el.querySelector('span').textContent).toBe('0')
        done()
      })
    })
  })
})

test('v-stream directive (multiple bindings on same node)', done => {
  const { ob, next } = mock()

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
        count: this.plus$.pluck('data')
          .startWith(0)
          .scan((total, change) => total + change)
      }
    },
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
  const { ob, next } = mock()

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
        count: click$.map(() => 1)
          .startWith(0)
          .scan((total, change) => total + change)
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
