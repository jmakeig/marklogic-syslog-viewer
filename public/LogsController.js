// Depends on LogsStore

function LogsController(model) {
  if(null === model || 'undefined' === typeof model) { throw new TypeError(); }

  this.model = model;
  this.store = new LogsStore(model.id); // FIXME: This is too tightly coupled
  this.views = {};
  
  this.views = {
    // Views are in charge of defering binding to elements
    'facets': new FacetsView('form#Facets'),
    'search': new QueryView('form#Search'),
    'messages': new MessagesView('table#Logs > tbody'),
  };
  
  this.views.facets.on('constraints:change', (function(constraints) {
    this.model.constraints = constraints;
  }).bind(this));
  
  this.views.search.on('query:change', (function(query) {
    this.model.query = query;
  }).bind(this));
  this.views.search.on('query:submit', queryChangeHandler.bind(this));
    
  // FIXME: This needs to be extracted to a proper View
  function messageChangeHandler(/*msgs*/) {
    this.views.messages.render(this.model.messages);
    var count = document.querySelector('footer .messages-count');
    //console.log(this.model.messages.length + ' message' + (this.model.messages.length > 1 ? 's' : ''));
    count.textContent = 'Showing ' 
      + this.model.messages.length.toLocaleString(this.model.locale)
      + ' message' 
      + (this.model.messages.length > 1 ? 's' : '')
      + ' of ' + this.model.total.toLocaleString(this.model.locale);
  };
  model.on('messages:changed', messageChangeHandler.bind(this));
  
  function facetsChangeHandler(facets) {
    //console.dir(model.getState());
    this.views.facets.render(
      this.model.facets, this.model.constraints, this.model.locale
    );
  }
  model.on('facets:changed', facetsChangeHandler.bind(this));
  
  // This is where the actual events to change sate start
  // Queries to the store are received by the controller which
  // updates the model which triggers events. The controller
  // listens for those and updates the UI, which may trigger
  // other events.
  function queryChangeHandler(query) {
    this.store.query(this.model.query, this.model.constraints);
    //this.store.facets(this.model.query, this.model.constraints);

    // TODO:  Use URI utility
    // FIXME: This mixes concerns, doesn't it?
    // FIXME: This is really ugly checking differences.
    if(!this.model.equals(history.state)) {
      var state = this.model.getState();
      
      // FIXME: Ugly
      var cs = [];
      for(c in state.constraints) {
        state.constraints[c].forEach(function(cv) { 
          cs.push(c + '=' + cv);
        });
      }
      
      history.pushState(state, 
        document.title + ': ' + query, 
        '/sse.html?' + ['q=' + encodeURIComponent(query)].concat(cs).join('&')
      );
    }
  }
  model.on('query:changed', (function(query) {
    this.views.search.render(query);
  }).bind(this));
  
  function constraintsChangeHandler(constraints) {
    this.store.query(this.model.query /* TODO: Facets */);
    //this.store.facets(this.model.query, this.model.constraints);
  }
  model.on('constraints:changed', constraintsChangeHandler.bind(this));
  
  // Store  
  this.store.on('trickle', function(payload) {
    model.messages.unshift(payload.message);
    model.facets = payload.facets;
    model.total = payload.total;
  });
  
  this.store.on('batch', function(msgs, facets, total) {
    model.total = total; // FIXME: Order matters here unfortunately
    model.messages = msgs;
    model.facets = facets;
  });
  
}

/********** View logic **********/
// FIXME: Get a real UI framework to do the rendering. This is awful.

function MessagesView(selector) {
  this.element = null;
  
  document.addEventListener('DOMContentLoaded', (function(e) {
    this.element = elementFromSelector(selector, document.createElement('tbody'));
  }).bind(this), false);
}
MessagesView.prototype = new EventEmitter2;
MessagesView.prototype.render = function(msgs) {
  var body = this.element;
  var table = body.parentNode;
  table.removeChild(body);
  this.element = body = document.createElement('tbody');
  
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
    var severityPill = document.createElement('span'),
        senderPill = document.createElement('span'),
        hostPill = document.createElement('span');
    //if(msg.severity) { severity.classList.add('severity', msg.severity.toLowerCase()); }
    severityPill.classList.add('pill');
    severityPill.classList.add(msg.severity);
    severityPill.textContent = msg.severity;
    severity.classList.add('severity');
    severity.appendChild(severityPill);
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
    // TODO: Use <time>, and maybe something like https://github.com/github/time-elements
    time.appendChild(document.createTextNode(currentTime.format(TIMESTAMP))); // .SSS for fractional seconds
    time.setAttribute('data-time', currentTime.format());
    time.classList.add('time');
    senderPill.classList.add('pill');
    senderPill.style.backgroundColor = stringToColour(msg.sender);
    //senderPill.textContent = msg.sender;
    sender.appendChild(senderPill);
    sender.appendChild(document.createTextNode(msg.sender));
    sender.classList.add('sender');
    hostPill.classList.add('pill');
    hostPill.style.backgroundColor = stringToColour(msg.host);
    //hostPill.textContent = msg.host;
    host.appendChild(hostPill);
    host.appendChild(document.createTextNode(msg.host));
    host.classList.add('host');
    message.innerHTML = msg.highlight || msg.message;
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

function QueryView(selector) {
  this.element = null;
  
  document.addEventListener('DOMContentLoaded', (function(e) {
    this.element = elementFromSelector(selector, document.createElement('form'));
    this.element.addEventListener('submit', (function(e) {
      e.preventDefault();
      //model.query = form.querySelector('input').value;
      this.emit('query:submit', this.query);
    }).bind(this));
    this.element.addEventListener('input', (function(e) {
      this.emit('query:change', this.query);
    }).bind(this), false);
  }).bind(this), false);
}
QueryView.prototype = new EventEmitter2;
QueryView.prototype.render = function(query) {
  this.element.querySelector('input[name="q"]').value = query;
}
Object.defineProperty(QueryView.prototype, 'query', {
  get: function() { return this.element.querySelector('input[name="q"]').value; },
  enumerable: true
});

function elementFromSelector(selector, fallback, parent) {
  parent = parent || document;
  if(selector instanceof HTMLElement) { return selector; }
  if('string' === typeof selector) { return parent.querySelector(selector); }
  return fallback || document.createElement('div');
}

/*
function deferDOM(f, that) {
  document.addEventListener('DOMContentLoaded', f.bind(that || null));
}
*/

function FacetsView(selector) {
  this.element = null;
  
  function handleChange(e) {
    this.emit('constraints:change', this.constraints);
  }
  
  // Defer attaching events until DOM is loaded
  document.addEventListener('DOMContentLoaded', (function(e) {
    this.element = elementFromSelector(selector, document.createElement('form'));
    this.element.addEventListener('change', handleChange.bind(this), false);
  }).bind(this));  
}
FacetsView.labels = {
  'severity': 'Severity',
  'host':     'Host',
  'sender':   'Sender'
};
FacetsView.icons = {
    'severity': '\ue809',
    'host':     '\ue805',
    'sender':   '\ue807'
  };
FacetsView.prototype = new EventEmitter2;
FacetsView.prototype.render = function(facets, constraints, locale) {
  form = this.element;
  // FIXME: Is this the most efficient way to clear?
  while(form.lastChild) { form.removeChild(form.lastChild); }
  
  Object.getOwnPropertyNames(facets).sort(/* TODO: Implement me */).forEach(function(f) {
    var table = document.createElement('table');
    // Custom sort for severity
    if('severity' === f) {
      facets[f].facetValues.sort(function(a, b) {
        var levels = {
          'emergency': 7, 
          'alert':     6,
          'critical':  5,
          'error':     4,
          'warning':   3,
          'notice':    2,
          'info':      1,
          'debug':     0
        };
        return levels[b.value] - levels[a.value];
      });
    }
    
    var colgroup = document.createElement('colgroup');
      var checkboxCol = document.createElement('col');
        checkboxCol.classList.add('facet-enabled');
        colgroup.appendChild(checkboxCol);
      var labelCol = document.createElement('col');
        labelCol.classList.add('facet-label');
        colgroup.appendChild(labelCol);
      var frequencyCol = document.createElement('col');
        frequencyCol.classList.add('facet-frequency');
        colgroup.appendChild(frequencyCol);
    table.appendChild(colgroup);
    
    
    var thead = document.createElement('thead');
      table.appendChild(thead);
    
    var headerRow = document.createElement('tr');
      var header = document.createElement('th');
      var headerIcon = document.createElement('span');
        headerIcon.classList.add('icon');
        headerIcon.textContent= FacetsView.icons[f];
        header.setAttribute('colspan', 3);
        header.appendChild(headerIcon);
        header.appendChild(document.createTextNode(FacetsView.labels[f]));
        headerRow.appendChild(header);
    thead.appendChild(headerRow);
        
    var tbody = document.createElement('tbody');
    
    facets[f].facetValues.forEach(function(fv) {
      var item = document.createElement('tr');
      
      var checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('name', f);
        checkbox.setAttribute('value', fv.name);
        if(!constraints || !constraints[f] || constraints[f].indexOf(fv.name) < 0) {
          checkbox.setAttribute('checked', 'checked');
        }
      var checkboxCell = document.createElement('td');
        if('severity' === f) {
          checkboxCell.classList.add('severity');
          checkboxCell.classList.add(fv.value);
        } else {
          checkboxCell.style.backgroundColor = stringToColour(fv.value);
        }
        checkboxCell.classList.add('facet-enabled');
        checkboxCell.appendChild(checkbox);
        item.appendChild(checkboxCell);
      var labelCell = document.createElement('td');
        labelCell.classList.add('facet-label');
        labelCell.appendChild(document.createTextNode(fv.name));
        item.appendChild(labelCell);
        
      var frequencyCell = document.createElement('td');
        frequencyCell.classList.add('facet-frequency');
        var frequencySpan = document.createElement('span');
          frequencySpan.setAttribute('data-frequency', fv.count);
          frequencySpan.classList.add('frequency');
          frequencySpan.textContent = fv.count.toLocaleString(locale);
          frequencyCell.appendChild(frequencySpan);
        item.appendChild(frequencyCell);
        
      tbody.appendChild(item);
    });
    
    table.appendChild(tbody);
    
    var container = document.createElement('div');  
      container.classList.add('facet', f);
    container.appendChild(table);
    form.appendChild(container);
  });
}

Object.defineProperty(FacetsView.prototype, 'constraints', {
  get: function() { 
    var boxes = Array.prototype.slice.call(this.element.querySelectorAll('input[type=checkbox]'));
    var constraints = Object.create(null);
    boxes.forEach(function(box) {
      if(box.checked) {
        if('undefined' === typeof constraints[box.name]) { constraints[box.name] = []; }
        constraints[box.name].push(box.value);
      }
    });
    return constraints;
  },
  set: function(constraints) {
    var boxes = Array.prototype.slice.call(this.element.querySelectorAll('input[type=checkbox]'));
    boxes.forEach(function(box) {
      box.checked = constraints[box.name] && constraints[box.name].indexOf(box.value) >= 0;
    });
  },
  
  enumerable: true
});
