var ArrayProxy = { // namespace
  // AOP pre-invocation advice. Returns a function.
  wrap: function(f, h, that) {
    var scope = that || this;
    return function() {
      if(false !== h.apply(scope)) {
        return f.apply(scope, arguments);
      }
    }
  },
 
  // Wrap each Array.prototype function with a custom function
  // that calls a handler before calling calling the actual Array
  // function. Returning false from the handler allows cancellation
  // of the proxied invocation. 
  proxy: function(arr, handler) {
    if(!Array.isArray(arr)) throw new TypeError('Can\'t proxy something that isn\'t an Array.');
    if('function' !== typeof handler) return arr;
    var Ap = Array.prototype;
    Object.getOwnPropertyNames(Ap).forEach(
      function(p) { 
        if('function' === typeof Ap[p] && 'toString' !== p) {
          arr[p] = ArrayProxy.wrap(
            Ap[p], 
            function() { // FIXME: This is probably slow
              return handler.apply(arr, [{type: p}]); // TODO: Create/reuse proper event type
            }, 
            arr
          )
        }
      }
    );
    return arr;
  }
}