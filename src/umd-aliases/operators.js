const operators = typeof require !== 'undefined'
  ? require('rxjs/operators')
  : typeof window !== 'undefined' && window.rxjs
    ? window.rxjs.operators
    : {}

const { share } = operators

export { share }
