var ArrayProxy = { // namespace
  // AOP pre-invocation advice. Returns a function.
  wrap: function(f, h, arr, that) {
    var scope = that || null; // this is ArrayProxy 
    return function() {
      //console.dir(arguments);
      //if(false !== h.apply(scope, arguments)) {
        var ret = f.apply(arr, arguments);
        h.apply(scope, arguments);
        return ret;
      //}
    }
  },
 
  // Wrap each Array.prototype function with a custom function
  // that calls a handler before calling calling the actual Array
  // function. Returning false from the handler allows cancellation
  // of the proxied invocation. 
  proxy: function(arr, handler, that) {
    if(!Array.isArray(arr)) throw new TypeError('Can\'t proxy something that isn\'t an Array.');
    if('function' !== typeof handler) return arr;
    var Ap = Array.prototype;
    Object.getOwnPropertyNames(Ap).forEach(
      function(p) { 
        if('function' === typeof Ap[p] && 'toString' !== p) {
          arr[p] = ArrayProxy.wrap(
            Ap[p], 
            function() { // FIXME: This is probably slow
              var args = Array.prototype.slice.call(arguments, 0);
              //console.log([{dummy: true}].concat(args));
              return handler.apply(
                that || arr, 
                [{type: p}].concat(args)
              ); // TODO: Create/reuse proper event type
            }, 
            arr, 
            that
          )
        }
      }
    );
    return arr;
  }
}