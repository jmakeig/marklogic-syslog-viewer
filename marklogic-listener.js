var path = require('path');

var express = require('express')
var app = express()

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


app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/stream', function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  var count = 0;
  var interval = setInterval(function() {
    console.log('sending message');
    res.write('id: ' + (++count) + '\n');
    res.write('data: asdf\n\n'); // Note the extra newline
  }, 2000);
})

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})

