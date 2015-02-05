// Depends on LogsStore

function LogsController(model) {
  if(null === model || 'undefined' === typeof model) { throw new TypeError(); }

  this.model = model;
  this.store = new LogsStore(model.id); // FIXME: This is too tightly coupled
    
  function messageChangeHandler(/*msgs*/) {
    var count = document.querySelector('footer .messages-count');
    //console.log(this.model.messages.length + ' message' + (this.model.messages.length > 1 ? 's' : ''));
    count.textContent = 'Showing ' 
      + this.model.messages.length 
      + ' message' 
      + (this.model.messages.length > 1 ? 's' : '');
  };
  model.on('messages:changed', messageChangeHandler.bind(this));

  function queryChangeHandler(query) {
    this.store.query(query /* TODO: Facets */);

    console.log('queryChangeHandler');
  
    // TODO: Use URI utility
    // FIXME: This mixes concerns, doesn't it?
    // FIXME: This is really ugly checking differences.
    if(!this.model.equals(history.state)) {
      history.pushState(this.model.getState(), 
        document.title + ': ' + query, 
        '/sse.html?q=' + encodeURIComponent(query)
      );
    }
    console.log('history.length = ' + history.length);
    // FIXME: This needs to be part of the view
    document.querySelector('input[name="q"]').value = query;
  }    
  model.on('query:changed', queryChangeHandler.bind(this));
  
  // Store  
  this.store.on('trickle', function(msg) {
    model.messages.unshift(msg);
  });
  
  this.store.on('batch', function(msgs) {
    model.messages = msgs;
  });
  
  
}
LogsController.prototype.initialize = function() {
  this.store.query(this.model.query);
}



/********** View logic **********/
// FIXME: A real framework would handle this.


// FIXME: Get a real UI framework to do the rendering. This is awful.
function renderMessages(msgs, locale) {
  var body = document.querySelector('table#Logs > tbody');
  var table = body.parentNode;
  table.removeChild(body);
  body = document.createElement('tbody');
  for(var i = 0; i < msgs.length; i++) {
    var msg = msgs[i];
    body.appendChild(renderRow(msg, msgs[i + 1]));
  }
  table.appendChild(body);

  function renderRow(msg, nextMsg, locale) {
    var TIMESTAMP = 'HH:mm:ss, YYYY-MM-DD';
    var row = document.createElement('tr');
    var time = document.createElement('td'),
        diff = document.createElement('td'),
        sender = document.createElement('td'),
        host = document.createElement('td'),
        severity = document.createElement('td'),
        message = document.createElement('td');
    if(msg.severity) { severity.classList.add('severity', msg.severity.toLowerCase()); }
    severity.appendChild(document.createTextNode(msg.severity));
    severity.setAttribute('data-severity', msg.severity);
    severity.setAttribute('title', msg.severity);
    var currentTime = moment(msg.time);
    var diffStr = '';
    if(nextMsg && nextMsg.time) {
      diffStr = moment.duration(
        currentTime.diff(
          moment(nextMsg.time)
        )
      ).asSeconds().toLocaleString(locale);
    }
    diff.appendChild(document.createTextNode(diffStr));
    diff.classList.add('diff');
    time.appendChild(document.createTextNode(currentTime.format(TIMESTAMP))); // .SSS for fractional seconds
    time.setAttribute('data-time', currentTime.format());
    time.classList.add('time');
    sender.appendChild(document.createTextNode(msg.sender));
    sender.classList.add('sender');
    host.appendChild(document.createTextNode(msg.host));
    host.classList.add('host');
    message.appendChild(document.createTextNode(msg.message));
    message.classList.add('message');
    row.appendChild(severity);
    row.appendChild(time);
    row.appendChild(diff);
    row.appendChild(sender);
    row.appendChild(host);
    row.appendChild(message);
    // row.classList.add('flash'); // Since we're redrawing each time, no way to figure out the new ones
    return row;
  }
}
