var path = require('path');

var express = require('express')
var app = express()

var bodyParser = require('body-parser')

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

app.route('/query')
  .get(function(req, res) {
    //buffers[req.sessionID] = new TimedBuffer(1000, 10);
    
    // TODO: Create or update the query rule for this session. 
    //       What about the case where there multiple tabs for the same session?
    //       Probably need the key to be sessionID + browser-defined ID
    //       The sessionID is private. The browser ID is not. However, they're only
    //       useful together as a compound key.
  });

/**
 * Write the event stream headers and then wait (?) for messages to be received.
 */
app.route('/stream/:appID') // ?q=query+string
  .get(function(req, res) {
    //console.log('Last-Event-ID: %s', req.get('Last-Event-ID'));
    console.log(req.sessionID);
    var sessionID = req.sessionID;
    var appID = req.params['appID'];
    var query = req.query['q'];
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    
    //if(!req.get('Last-Event-ID')) {
      db.documents.query(
        qb.where(
          qb.byExample(
            {
              message: { $word: query }
            }   
          )
        )
        .orderBy(
          qb.sort('time', 'descending')
        )
        .slice(1, 50) // FIXME: Set this from the UI
      )
        .result(function(response) {
          writeEvent({
            event: 'batch',
            data: JSON.stringify(response.map(function(r) { return r.content; })), // FIXME: Why do I have to JSON.stringify here?
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
      console.log('created alert for session (%s) and app (%s) with query (%s)', sessionID, appID, 'query');
    }, function(error) {
      console.log(JSON.stringify(error, null, 2));
    });

    
    var buffer = buffers.get(sessionID, appID);
    console.dir(Object.keys(buffers.buffers));
    buffer.on('flush', function(msgs) {
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
    });
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

/**
 * Listen for individual messages sent from a MarkLogic trigger.
 */
app.post('/logs/:sessID/:appID', bodyParser.text({type: 'application/json'}), function(req, res) {
  console.log('POST to %s: %s', req.url, req.body);
  var sessionID = req.params['sessID'];
  var appID = req.params['appID'];
  if(buffers.has(sessionID, appID)) {
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
  console.log('Example app listening at http://%s:%s', host, port)
})

