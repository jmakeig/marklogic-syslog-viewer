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
    'messages': null, // TODO
  };
  
  this.views.facets.on('constraints:change', (function(constraints) {
    this.model.constraints = constraints;
  }).bind(this));
  
  this.views.search.on('query:change', (function(query) {
    this.model.query = query;
  }).bind(this));
  this.views.search.on('query:submit', queryChangeHandler.bind(this));
    
  function messageChangeHandler(/*msgs*/) {
    renderMessages(this.model.messages);
    var count = document.querySelector('footer .messages-count');
    //console.log(this.model.messages.length + ' message' + (this.model.messages.length > 1 ? 's' : ''));
    count.textContent = 'Showing ' 
      + this.model.messages.length 
      + ' message' 
      + (this.model.messages.length > 1 ? 's' : '');
  };
  model.on('messages:changed', messageChangeHandler.bind(this));
  
  function facetsChangeHandler(facets) {
    this.views.facets.render(
      this.model.facets, this.model.constraints, this.model.locale
    );
  }
  model.on('facets:changed', facetsChangeHandler.bind(this));
  
  function queryChangeHandler(query) {
    this.store.query(this.model.query /* TODO: Facets */);
    this.store.facets(this.model.query);

    // TODO: Use URI utility
    // FIXME: This mixes concerns, doesn't it?
    // FIXME: This is really ugly checking differences.
    if(!this.model.equals(history.state)) {
      history.pushState(this.model.getState(), 
        document.title + ': ' + query, 
        '/sse.html?q=' + encodeURIComponent(query)
      );
    }
  }
  model.on('query:changed', (function(query) {
    this.views.search.render(query);
  }).bind(this));
  
  function constraintsChangeHandler(constraints) {
    this.store.query(this.model.query /* TODO: Facets */);
    this.store.facets(this.model.query);
  }
  model.on('constraints:changed', constraintsChangeHandler.bind(this));
  
  // Store  
  this.store.on('trickle', function(msg) {
    model.messages.unshift(msg);
  });
  
  this.store.on('batch', function(msgs) {
    model.messages = msgs;
  });
  
  this.store.on('facets', function(facets, query, constraints) {
    model.facets = facets;
  });
  
  
}

/********** View logic **********/
// FIXME: Get a real UI framework to do the rendering. This is awful.

// FIXME: Convert this over to the view component architecture below.
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
    // TODO: Use <time>, and maybe something like https://github.com/github/time-elements
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
  
  // Defer attaching events until DOM is loaded
  document.addEventListener('DOMContentLoaded', (function(e) {
    this.element = elementFromSelector(selector, document.createElement('form'));
    this.element.addEventListener('change', handleChange.bind(this), false);
  }).bind(this));

  function handleChange(e) {
    console.dir(this.constraints);
    this.emit('constraints:change', this.constraints);
  }  
}
FacetsView.prototype = new EventEmitter2;
FacetsView.prototype.render = function(facets, constraints, locale) {
  //var form = document.querySelector('form#Facets');
  form = this.element;
  while(form.lastChild) { form.removeChild(form.lastChild); }
  /*
    <div class="facet hosts">
      <h3>Hosts</h3>
      <ol>
        <li><input type="checkbox"/> ex1.example.com (15,839)</li>
        <li><input type="checkbox"/> qa.some-other.com (4,402)</li>
        <li><input type="checkbox"/> ex2.example.com (189)</li>
        <li><input type="checkbox"/> ex3.example.com (5)</li>
        <li><input type="checkbox"/> ex4.example.com (0)</li>
      </ol>
    </div>  
  */
  // console.dir(facets);
  var list, header;
  Object.getOwnPropertyNames(facets).forEach(function(f) {
    list = document.createElement('ol');
    facets[f].facetValues.forEach(function(fv) {
      var item = document.createElement('li');
      var checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('name', f);
        checkbox.setAttribute('value', fv.name);
      item.appendChild(checkbox);
      item.appendChild(document.createTextNode(' ' + fv.name + ' (' + fv.count + ')'));
      list.appendChild(item);
      header = document.createElement('h3');
      header.textContent = f;
    });
    
    var container = document.createElement('div');  
      container.classList.add('facet', f);
    container.appendChild(header);
    container.appendChild(list);
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
