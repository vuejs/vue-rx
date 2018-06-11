# vue-rx [![Build Status](https://circleci.com/gh/vuejs/vue-rx/tree/master.svg?style=shield)](https://circleci.com/gh/vuejs/vue-rx/tree/master)

[English](README.md) | 简体中文

将 [RxJS v6](https://github.com/ReactiveX/rxjs) 集成到 Vue.js。

> **相比 5.0 的不兼容变更**
>
> - vue-rx v6 现在默认只对 RxJS V6 生效。如果你想继续使用 RxJS v5 风格的代码，安装 `rxjs-compat`。

### 安装

#### NPM + ES2015

**`rxjs` 需要作为 peer dependency 引入。**

```bash
npm install vue vue-rx rxjs --save
```

```js
import Vue from 'vue';
import VueRx from 'vue-rx';

Vue.use(VueRx);
```

webpack 打包默认会使用 `dist/vue-rx.esm.js`。这样引入最小数量的 Rx 操作符并且保证了最小的打包体积。

#### 全局脚本

如果要在浏览器环境使用，需要引入 UMD 构建版本 `dist/vue-rx.js`。在浏览器环境中的 UMD 构建版本会假设 `window.rxjs` 已经存在，因此你需要确保在 Vue.js 和 RxJS 之后引入 `vue-rx.js`。如果 `window.Vue` 存在的话，`vue-rx` 会自动安装。

例子:

```html
<script src="https://unpkg.com/rxjs/bundles/rxjs.umd.js"></script>
<script src="https://unpkg.com/vue/dist/vue.js"></script>
<script src="../dist/vue-rx.js"></script>
```

### 如何使用

```js
// 用 `subscriptions` 选项提供 Rx observables
new Vue({
  el: '#app',
  subscriptions: {
    msg: messageObservable
  }
});
```

```html
<!-- 绑定到模板 -->
<div>{{ msg }}</div>
```

`subscriptions` 选项也可以接受一个函数，这样就可以在每个组件实例中返回独一无二的 observables：

```js
import { Observable } from 'rxjs'

Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: new Observable(...)
    }
  }
})
```

Observables 会以 `vm.$observables` 的形式暴露：

```js
const vm = new Vue({
  subscriptions: {
    msg: messageObservable
  }
});

vm.$observables.msg.subscribe(msg => console.log(msg));
```

### `v-stream`：流式 DOM 事件

`vue-rx` 提供 `v-stream` 让你向一个 Rx Subject 流式发送 DOM 事件。语法和 `v-on` 相似，指令参数对应事件名，绑定值对应 Rx Subject。

```html
<button v-stream:click="plus$">+</button>
```

注意在渲染发生之前你需要在 vm 实例上声明一个 `rxjs.Subject` 实例 —— `plus$`，就像声明数据那样。你也可以在 `subscriptions` 函数中这样做。

```js
import { Subject } from 'rxjs';
import { map, startWith, scan } from 'rxjs/operators';

new Vue({
  subscriptions() {
    // 声明接收的 Subjects
    this.plus$ = new Subject();
    // ...然后使用 Subjects 作为来源流创建订阅。
    // 来源流以 `{ event: HTMLEvent, data?: any }` 的格式发送数据
    return {
      count: this.plus$.pipe(
        map(() => 1),
        startWith(0),
        scan((total, change) => total + change)
      )
    };
  }
});
```

或者，使用 `domStreams` 简写选项：

```js
new Vue({
  // 需要传递 `Rx` 给 `Vue.use()` 暴露 `Subject`
  domStreams: ['plus$'],
  subscriptions() {
    // 使用 `this.plus$`
  }
});
```

最后，使用另一种语法给流传递额外的数据：

```html
<button v-stream:click="{ subject: plus$, data: someData }">+</button>
```

当你需要伴随诸如 `v-for` 迭代的临时模板变量一起传递，这就非常有用了。你可以直接从来源流撷取想要的数据。

```js
const plusData$ = this.plus$.pipe(pluck('data'));
```

从 3.1 版本开始，你可以传入额外的选项(作为第三个参数一起传入原生的 `addEventListener`)：

```html
<button v-stream:click="{
  subject: plus$,
  data: someData,
  options: { once: true, passive: true, capture: true }
}">+</button>
```

更具体的用法请查阅[实例](https://github.com/vuejs/vue-rx/blob/master/example/counter.html)。

### `v-stream`：从子组件流式发送自定义事件

跟流式 `DOM` 事件很相似，`v-stream` 也可以被用于组件，它会根据子组件触发的自定义事件创建 observables。运作方式跟 `v-on` 相似：

```html
<div>
  <!-- 自定义组件 -->
  <pagination v-on:change="pageChanged()"></pagination>

  <!-- 在自定义组件上使用 `v-stream` -->
  <pagination v-stream:change="pageChange$"></pagination>
</div>
```

### 其它 API 方法

#### `$watchAsObservable(expOrFn, [options])`

这是一个添加到实例的原型方法。你可以根据一个值的侦听器创建 observable。值会以 `{ newValue, oldValue }` 的格式触发：

```js
import { pluck, map } from 'rxjs/operators';

const vm = new Vue({
  data: {
    a: 1
  },
  subscriptions() {
    // 用 Rx 操作符声明式地映射成另一个属性
    return {
      aPlusOne: this.$watchAsObservable('a').pipe(
        pluck('newValue'),
        map(a => a + 1)
      )
    };
  }
});

// 或者产生副作用...
vm.$watchAsObservable('a').subscribe(
  ({ newValue, oldValue }) => console.log('stream value', newValue, oldValue),
  err => console.error(err),
  () => console.log('complete')
);
```

可选的 `options` 对象，接受的选项与 `vm.$watch` 一致。

#### `$eventToObservable(event)`

转化 `vue.$on` (包括生命周期事件) 到 Observables。值会以 `{ name, msg }` 的格式触发：

```js
import { interval } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

const vm = new Vue({
  created() {
    this.$eventToObservable('customEvent').subscribe(event =>
      console.log(event.name, event.msg)
    );
  }
});

// `vm.$once` 的 `vue-rx` 版本
this.$eventToObservable('customEvent').pipe(take(1));

// 另一种取消订阅的方法：
let beforeDestroy$ = this.$eventToObservable('hook:beforeDestroy').pipe(
  take(1)
);

interval(500).pipe(takeUntil(beforeDestroy$));
```

#### `$subscribeTo(observable, next, error, complete)`

这是一个添加到实例的原型方法。你可以用它订阅一个 observable，但是得让 VueRx 管理它的 dispose/unsubscribe。

```js
import { interval } from 'rxjs';

const vm = new Vue({
  mounted() {
    this.$subscribeTo(interval(1000), function(count) {
      console.log(count);
    });
  }
});
```

#### `$fromDOMEvent(selector, event)`

这是一个添加到实例的原型方法。可以用它根据实例内部元素的 DOM 事件创建 observable。与 `Rx.Observable.fromEvent` 类似，甚至在 DOM 渲染前，在 `subscriptions` 函数中使用都是有用的。

`selector` 用来查找组件根元素的后代节点，如果你想监听根元素，传入 `null` 作为第一个参数。

```js
import { pluck } from 'rxjs/operators';

const vm = new Vue({
  subscriptions() {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').pipe(
        pluck('target', 'value')
      )
    };
  }
});
```

#### `$createObservableMethod(methodName)`

转化函数调用为输出调用参数的 observable 队列。

这是一个添加到实例的原型方法。用来根据函数名创建一个共享的，热的 observable。这个函数会被赋值到 vm 方法上去。

```html
<custom-form :onSubmit="submitHandler"></custom-form>
```

```js
const vm = new Vue({
  subscriptions() {
    return {
      // 需要 `share` 操作符
      formData: this.$createObservableMethod('submitHandler')
    };
  }
});
```

你可以使用 `observableMethods` 选项使代码更加声明式：

```js
new Vue({
  observableMethods: {
    submitHandler: 'submitHandler$'
    // 或者使用数组简写: ['submitHandler']
  }
});
```

上面代码会自动在实例上创建两个东西：

1.  一个是可以用 `v-on` 绑定到模板的 `submitHandler` 方法；
2.  一个是可以流式调用 `submitHandler` 的`submitHandler$` observable。

[例子](https://github.com/vuejs/vue-rx/blob/master/example/counter-function.html)

### 注意事项

你不能使用 `watch` 选项去侦听订阅 (subscriptions)，因为它在设置订阅之前就被处理完毕了。但是你可以在 `created` 钩子中使用 `$watch` 作为替代方案。

### 示例

到 `/examples` 目录查看一些简单示例。

### License

[MIT](http://opensource.org/licenses/MIT)
