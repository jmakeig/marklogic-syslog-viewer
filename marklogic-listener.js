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

var TimedBuffer = require('./timed-buffer.js');
var buffers = {
  //"_": new TimedBuffer(1000, 10)
};

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.route('/query')
  .get(function(req, res) {
    buffers[req.sessionID] = new TimedBuffer(1000, 10);
    
    // TODO: Create or update the query rule for this session. 
    //       What about the case where there multiple tabs for the same session?
    //       Probably need the key to be sessionID + browser-defined ID
    //       The sessionID is private. The browser ID is not. However, they're only
    //       useful together as a compound key.
  });

// TODO: Turn the buffers object into a class with look-up functions.
function compoundKey(sessionID, appID) {
  return sessionID + ' ' + appID;
}

/**
 * Write the event stream headers and then wait (?) for messages to be received.
 */
app.route('/stream/:appID')
  .get(function(req, res) {
    //console.log('Last-Event-ID: %s', req.get('Last-Event-ID'));
    console.log(req.sessionID);
    var sessionID = '1234567890'; // FIXME: = req.sessionID
    var appID = req.params['appID'];
    var key = compoundKey(sessionID, appID);
    if(!buffers[key]) {
      buffers[key] = new TimedBuffer(1000, 10);
    }
    var buffer = buffers[key];
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
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
  buffers[compoundKey(sessionID, appID)].push(req.body);
  res.sendStatus(204);
  res.end();
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})

