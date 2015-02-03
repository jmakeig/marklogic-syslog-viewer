function LogsStore(id) {
  if(null === id || 'undefined' === typeof id) { throw new TypeError('Must supply an id'); }
  this.id = id;
  this.source = null;
};
LogsStore.prototype = Object.create(EventEmitter2.prototype);
LogsStore.prototype.query = function(query, facets) {
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
    that.emit('trickle', msg);
  });

  this.source.addEventListener('batch', function(e) {
    var batch = JSON.parse(e.data);
    //that.model.messages = batch;
    that.emit('batch', batch);
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

