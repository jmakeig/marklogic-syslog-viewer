// Depends on EventEmitter2

function LogsModel() {
  var _state = {
    'id': util.guid(),
    'maxWindowLength': 250,
    'query': '',
    'facets': undefined, // ?
    'isListening': true
  }
  // Transient state
  var _messages = null; // Transient state populated later based on other state. //ArrayProxy.proxy([], messagesChangeHandler.bind(this));
  
  Object.defineProperty(this, 'id', {
    value: _state.id,
    enumerable: true,
    writable: false
  });
  
  Object.defineProperty(this, 'query', {
    get: function() { return _state.query; },
    set: function(q) {
      if(q !== _state.query) {
        this.emit('query:changed', _state.query = q);
      }
    },
    enumerable: true
  });
  
  Object.defineProperty(this, 'facets', {
    get: function() { return _state.facets; },
    set: function(value) {
      if(!Array.isArray(value)) { throw new TypeError('Must be an Array'); }
      // TODO: Only update the value and fire the event if it's actually changed
      _state.facets = value; // FIXME: ?
      this.emit('facets:changed');
    },
    enumerable: true
  });
  
  Object.defineProperty(this, 'messages', {
    get: function() { return _messages; },
    set: function(ms) {
      if(!Array.isArray(ms)) { throw new TypeError('Must be an Array'); }
      _messages = ArrayProxy.proxy(
        truncateInPlace(ms, this.maxWindowLength),
        messagesChangeHandler.bind(this)
      );
      this.emit('messages:changed');
    },
    enumerable: true
  });
  
  function truncateInPlace(arr, maxLength, silent /* If true, subverts proxy to not fire change event */) {
    maxLength = maxLength || _maxWindowLength;
    silent = !!silent;
    // Call the Array.prototype version, not the proxy in silent mode
    var splice = silent ? Array.prototype.splice : arr.splice;
    // splice, unlike, slice modifies in-place
    splice.call(
      arr,
      maxLength, // start
      arr.length - (Math.min(maxLength, arr.length) - 1) // number to delete
    );
    // Need to sort in the case where delivery is delayed. 
    // Message timestamps will still reflect the original log time.
    Array.prototype.sort.call(arr, function(a, b) {
      var a = new Date(a.time);
      var b = new Date(b.time);
      // Reverse order
      return b - a;
    });
    return arr;        
  }
  
  Object.defineProperty(this, 'maxWindowLength', {
    get: function() { return _state.maxWindowLength; },
    set: function(value) {
      if('number' !== typeof value || value < 1) { throw new TypeError('maxWindowLength must be a non-zero, positive number'); }
      if(value !== this.maxWindowLength) {
        if(value < this.maxWindowLength) {
          truncateInPlace(this.messages, value);
        }
        _state.maxWindowLength = value;
        this.emit('maxwindowlength:changed');
      }
    },
    enumerable: true
  });
  
  function messagesChangeHandler(e, args) {
    console.log(e.type);
    truncateInPlace(_messages, this.maxWindowLength, true);
    var messages = args;
    switch(e.type) {
      case 'push':
      case 'unshift': // unshift allows passing multiple arguments
        this.emit('messages:changed', Array.prototype.slice.call(arguments, 1));  // Arguments less the event
        break;
      case 'concat':
      case 'join':
      case 'slice': // None of these changes the array
        break;
      default:
        this.emit('messages:changed');
        break;
    }
    console.log(this.messages.length + ' total. Latest: ' + this.messages[0].message.time);
  }
  function facetsChangeHandler(e, args) { console.warn('FIXME: Calling facetsChangeHandler'); }
  
  Object.defineProperty(this, 'isListening', {
    get: function() { return _state.isListening; },
    set: function(value) {
      if(value !== this.isListening) {
        this.emit('islistening:changed', _state.isListening = value);
      }
    },
    enumerable: true
  });
  
  // Protected methods
  /*
   * Set the internal state of the model from a thin JSON-like data structure, 
   * likely coming from window.onpopstate. The inverse of LogsModel.getState().
   * @protected
   */
  this.setState = function(state) {
    if('undefined' === typeof state || null === state) { throw new TypeError(); }
    function setProp(prop, index, array) {
      _state[prop] = state[prop];
    };
    // Remember to update this whitelist
    ['id', 'query', 'facets', 'maxWindowLength', 'isListening'].forEach(setProp, this);
  };
  /*
   * Get the internal state of the model as a thin, JSON-like data structure.
   * The inverse of LogsModel.setState().
   * @protected
   */
  this.getState = function() {
    var state = Object.create(null);
    function getProp(prop, index, array) {
      if(Array.isArray(this[prop])) {
        state[prop] = ArrayProxy.unproxy(this[prop]);
      } else {
        state[prop] = this[prop];
      }
    }
    // Remember to update this whitelist
    ['id', 'query', 'facets', 'maxWindowLength', 'isListening'].forEach(getProp, this);
    return state;
  }
}
LogsModel.prototype = Object.create(EventEmitter2.prototype);