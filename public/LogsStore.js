function LogsStore(id) {
  if(null === id || 'undefined' === typeof id) { throw new TypeError('Must supply an id'); }
  this.id = id;
  this.source = null;
};
LogsStore.prototype = Object.create(EventEmitter2.prototype);
LogsStore.prototype.query = function(query, constraints) {
  var url = '/stream/' + this.id + 
    (query ? '?q=' + encodeURIComponent(query) : '');
  //console.log(url);

  // Close the existing EventSource if one already exists
  if(this.source) { this.source.close(); }
  
  this.source = new EventSource(url);

  var that = this;

  this.source.addEventListener('log', function(e) {
    var msg = JSON.parse(e.data);
    //that.model.messages.unshift(msg);
    that.emit('trickle', msg, query, constraints);
  });

  this.source.addEventListener('batch', function(e) {
    var batch = JSON.parse(e.data);
    //that.model.messages = batch;
    that.emit('batch', batch, query, constraints);
  });

  this.source.addEventListener('open', function(e) {
    //console.dir(this);
    console.log('Listening on ' + this.url);
  });

  this.source.onerror = function(e) {
    switch(e.target.readyState) {
      // Reconnecting
      case EventSource.CONNECTING:
        console.log('Reconnecting to ' + url);
        break;
      // if error was fatal
      case EventSource.CLOSED:
        console.error('Wasn’t able to reconnect to ' + url);
        break;
    }
  }
};
LogsStore.prototype.facets = function(query, constraints) {
  var dummy = {
  "sender": {
    "type": "xs:string",
    "facetValues": [
      {
        "name": "MarkLogic",
        "count": 452,
        "value": "MarkLogic"
      },
      {
        "name": "node",
        "count": 254,
        "value": "node"
      }
    ]
  },
  "host": {
    "type": "xs:string",
    "facetValues": [
      {
        "name": "MacPro-2600",
        "count": 706,
        "value": "MacPro-2600"
      }
    ]
  },
  "severity": {
    "type": "xs:string",
    "facetValues": [
      {
        "name": "alert",
        "count": 24,
        "value": "alert"
      },
      {
        "name": "critical",
        "count": 27,
        "value": "critical"
      },
      {
        "name": "debug",
        "count": 44,
        "value": "debug"
      },
      {
        "name": "emergency",
        "count": 1,
        "value": "emergency"
      },
      {
        "name": "error",
        "count": 38,
        "value": "error"
      },
      {
        "name": "info",
        "count": 94,
        "value": "info"
      },
      {
        "name": "notice",
        "count": 40,
        "value": "notice"
      },
      {
        "name": "warning",
        "count": 438,
        "value": "warning"
      }
    ]
  }
};
  this.emit('facets', dummy, query, constraints);
}


