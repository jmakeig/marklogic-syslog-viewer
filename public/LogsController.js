// FIXME: Poor man's export
var LogsController = (function() {
  function LogsController(model) {
    if(null === model || 'undefined' === typeof model) { throw new TypeError(); }
  
    this.model = model;
    this.eventSource = null;
  
    function messageChangeHandler(/*msgs*/) {
      renderMessages(this.model.messages, window.navigator.userLanguage || window.navigator.language);
      var count = document.querySelector('footer .messages-count');
      //console.log(this.model.messages.length + ' message' + (this.model.messages.length > 1 ? 's' : ''));
      count.textContent = 'Showing ' 
        + this.model.messages.length 
        + ' message' 
        + (this.model.messages.length > 1 ? 's' : '');
    };
 
    model.on('messages:changed', messageChangeHandler.bind(this));

    function queryChangeHandler(query) {
      this.eventSource.close();
      this.initializeStream();
    
      // TODO: Use URI utility
      history.pushState(this.model.getState(), 
        document.title, 
        '/sse.html?q=' + encodeURIComponent(query)
      );
    }    
    model.on('query:changed', queryChangeHandler.bind(this));
  }
  // FIXME: This is mixing concerns
  LogsController.prototype.initializeStream = function() {
    var url = '/stream/' + this.model.id + 
      (this.model.query ? '?q=' + encodeURIComponent(this.model.query) : '');
    //console.log(url);
    this.eventSource = new EventSource(url);
  
    var that = this;
    var source = this.eventSource;
  
    source.addEventListener('log', function(e) {
      var msg = JSON.parse(e.data);
      that.model.messages.unshift(msg);
    });

    source.addEventListener('batch', function(e) {
      var batch = JSON.parse(e.data);
      that.model.messages = batch;
    });

    source.addEventListener('open', function(e) {
      //console.dir(this);
      console.log('Listening on ' + this.url);
    });

    source.onerror = function(e) {
      console.dir(e);
      this.close();
    }
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
  return LogsController;
})()