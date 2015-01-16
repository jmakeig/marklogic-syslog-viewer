var path = require('path');

var express = require('express')
var app = express()

var bodyParser = require('body-parser')

var cookieParser = require('cookie-parser');
app.use(cookieParser());

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


var EventEmitter = require('events').EventEmitter;
var listener = new EventEmitter();

app.get('/', function (req, res) {
  res.send('Hello World!')
});

/**
 * Write the event stream headers and then wait (?) for messages to be received.
 */
app.route('/stream')
  .get(function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    listener.on('message', function(msg) {
      writeEvent({
        event: 'log',
        data: JSON.stringify(msg)
      }, res);
      //res.write('event: log\n');
      //res.write('id: ' + (++count) + '\n');
      //res.write('data: '+ JSON.stringify(msg) +'\n\n'); // Note the extra newline
    });
  });

/**
 * Formats writes a dictionary of event data in the format that
 * server-sent events expects.
 */
function writeEvent(event, stream) {
  for(var p in event) {
    stream.write(p + ': ' + event[p] + '\n');
  }
  stream.write('\n');
}

/**
 * Listen for individual messages sent from a MarkLogic trigger.
 */
app.post('/logs', bodyParser.json(), function(req, res) {
  console.log('POST to /logs');
  listener.emit('message', req.body);
  res.sendStatus(204);
  res.end();
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})

