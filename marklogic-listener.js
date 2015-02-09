var logger = require('./logger.js');
var path = require('path');

var express = require('express')
var app = express()

var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

// FIXME: Make this route-specific, not global
var session = require('express-session');
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  })
);

// var cors = require('cors');
// app.use(cors());

// var passport = require('passport');
// var LocalStrategy = require('passport-local').Strategy;
// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     console.log('LocalStrategy');
//     return done(null, { name: username });  
//   }
// ));
// app.use(passport.initialize());
// app.use(passport.session()); // persistent login sessions
// 
// passport.serializeUser(function(user, done) {
//   done(null, user.name);
// });
// 
// passport.deserializeUser(function(id, done) {
//   done(err, {name: id});
// });

app.use(express.static(path.join(__dirname, 'public')));

// app.post('/login',
//   passport.authenticate('local'),
//   function(req, res) {
//     console.log('Authenticated with session %j', res.session);
//   }
// );

var Buffers = require('./buffers.js');
var buffers = new Buffers();

app.get('/', function (req, res) {
  res.send('Hello World!')
});

var marklogic = require('marklogic');
var conn = require('./marklogic-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var qb = marklogic.queryBuilder;

/**
 * Write the event stream headers and then wait (?) for messages to be received.
 */
app.route('/stream/:appID') // ?q=query+string
  .get(function(req, res) {
    //console.log('Last-Event-ID: %s', req.get('Last-Event-ID'));
    //console.log(req.sessionID);
    var sessionID = req.sessionID;
    var appID = req.params['appID'];
    var query = req.query['q'] || null;
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    
    //if(!req.get('Last-Event-ID')) {
      var where = [
        qb.parsedFrom(query ,
          qb.parseBindings( 
            qb.word('host', qb.bind('h')),
            qb.value('severity', qb.bind('l')),
            qb.word('sender', qb.bind('s'))
          )
        ),
        qb.collection('logs')
      ];
      if(null === query) {
        where = qb.collection('logs'); // Everything
      }
      //console.log(where);
      db.documents.query(
        qb.where(where)
        .orderBy(
          qb.sort('time', 'descending')
        )
        .slice(1, 250) // FIXME: Set this from the UI
        .calculate(
          qb.facet('sender'),
          qb.facet('host'),
          qb.facet('severity')
        )
      )
        .result(function(response) {
          //console.log('%j', response[0]);
          writeEvent({
            event: 'batch',
            data: JSON.stringify(
              {
                'messages': response.slice(1).map(function(r) { return r.content; }),
                'facets': response[0].facets,
                'total': response[0].total
              }
            ),
            id: 'batch'
          }, res);
        });
    //}
    
    // This is intentionally run concurrently with the query (if the query runs at all)
    db.resources.put({
      name: 'alerts', 
      params: { 'sessionID': sessionID, 'appID': appID },
      documents: [
        {
          contentType: 'application/json',
          content: { query: query } 
        }
      ]
    }).result(function(response) {
      //console.log(response);
      logger.info('Created alert for session (%s) and app (%s) with query (%s)', sessionID, appID, query);
    }, function(error) {
      logger.error(JSON.stringify(error, null, 2));
    });

    // logger.debug('Total buffers: ' + buffers.count);
    var buffer = buffers.get(sessionID, appID);
    // FIXME: I don’t understand why I have to clear the flush listeners and can’t reuse,
    //        as below wit the if statement.
    buffer.removeAllListeners('flush');
    //console.dir(Object.keys(buffers.buffers));
    logger.info('Subscribing to buffer %s', Buffers.key(sessionID, appID));
    // logger.debug('Buffer has %d listeners to \'flush\'', 
    //   require('events').EventEmitter.listenerCount(buffer, 'flush'));
    //if(0 === require('events').EventEmitter.listenerCount(buffer, 'flush')) {
    buffer.on('flush', function(msgs) {
      //console.log('Buffer session %s, app %s', this.session, this.app);
      if(sessionID === this.session && appID === this.app) {
        msgs.forEach(function(msg) {
          writeEvent({
            event: 'log',
            data: msg, 
            // If the connection to the server is dropped, a special HTTP header (Last-Event-ID) 
            // is set with the new request. This lets the browser determine which event is 
            // appropriate to fire. The message event contains a e.lastEventId property.
            // <http://www.html5rocks.com/en/tutorials/eventsource/basics/>
            id: msg.time // Use the message's timestamp as the last identifier
          }, res);
        });
      }
    });
    // } else {
    //   logger.debug('Buffer has %d \'flush\' listeners', require('events').EventEmitter.listenerCount(buffer, 'flush'));
    // }
  });

/**
 * Formats writes a dictionary of event data in the format that
 * server-sent events expects.
 */
function writeEvent(event, stream) {
  // options = options || {};
  for(var p in event) {
    stream.write(p + ': ' + event[p] + '\n');
  }
  // if(true === options.includeId) {
  //   stream.write('id: ' + (new Date()).toISOString());
  // }
  stream.write('\n');
}

app.route('/facets') // ?q=query+string
  .get(function(req, res) {
    //console.log('Last-Event-ID: %s', req.get('Last-Event-ID'));
    //console.log(req.sessionID);
    var sessionID = req.sessionID;
    var appID = req.params['appID'];
    var query = req.query['q'] || null;
    
    db.documents.query(
      // TODO: Incorporate query
      qb.where(qb.collection('logs'))
      .calculate(
        qb.facet('sender'),
        qb.facet('host'),
        qb.facet('severity')
      )
      //.withOptions({view: 'facets'})
      .slice(0)
    )
    .result(function(response) {
      res
        .status(200)
        .json(response[0].facets);
    }, function(error) {
      logger.error(error);
    });
  });

/*
 * Set-and-forget logging endpoint from the browser.
 */
app.post('/logger', bodyParser.text({type: 'application/json'}), function(req, res) {
  res.sendStatus(202);
  res.end();
  var msg = req.body;
  // FIXME: How do I differentiate these from the application-level logs?
  logger[msg.level](msg.body);
});

/**
 * Listen for individual messages sent from a MarkLogic trigger.
 */
app.post('/logs/:sessID/:appID', bodyParser.text({type: 'application/json'}), function(req, res) {
  // console.log('POST to %s: %s', req.url, req.body);
  var sessionID = req.params['sessID'];
  var appID = req.params['appID'];
  if(buffers.has(sessionID, appID)) {
    logger.info('Received message for buffer %s', Buffers.key(sessionID, appID));
    buffers.get(sessionID, appID).push(req.body);
    res.sendStatus(204);
    res.end();
  } else {
    // If the session doesn't exist, alert the client to delete the rule.
    // TODO: Is this logic correct?
    res.sendStatus(404);
    res.end();
  }
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  logger.info('Example app listening at http://%s:%s', host, port)
})

