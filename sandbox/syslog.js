var winston = require('winston');
var PosixSyslog = require('winston-posix-syslog').PosixSyslog;
//winston.add(PosixSyslog, { level: 'debug', levels: winston.config.syslog.levels });

// http://tmont.com/blargh/2013/12/writing-to-the-syslog-with-winston
// var SyslogTransport = require('./syslog-transport.js');
// var transport = new SyslogTransport({
//   level: 'debug',
//   id: 'hello syslog',
//   facility: 'user',
//   showPid: true
// });
// 
// var log = new winston.Logger({
//   level: 'debug',
//   transports: [ transport ]
// });
// 
// log.info('hello world');

var l = {level: 'debug'};
var syslog = new PosixSyslog();
var log = new winston.Logger({
  // This doesn't seem to work
  levels: winston.config.syslog.levels,
  level: 'debug',
  transports: [syslog, new (winston.transports.Console)(l)]
});
log.setLevels(winston.config.syslog.levels);

// var levels = {
//   debug: 'debug',
//   info: 'info',
//   notice: 'notice',
//   warn: 'warning',
//   error: 'err',
//   crit: 'crit',
//   alert: 'alert'
// };

// var levels = winston.config.syslog.levels;

var levels = { debug: 'd', error: 'e'}

for(var level in levels) {
  console.log(level);
  log.log(level, level);
}

// winston.add(PosixSyslog, { levels: 
//   {
//     debug: 7,
//     info: 6,
//     notice: 5,
//     warn: 4,
//     error: 3,
//     crit: 2,
//     alert: 1
//   }
// });

// https://github.com/AntonNguyen/winston-posix-syslog/blob/master/lib/winston-posix-syslog.js#L6-L14
// var levels = {
//   debug: 'debug',
//   info: 'info',
//   notice: 'notice',
//   warn: 'warning',
//   error: 'err',
//   crit: 'crit',
//   alert: 'alert'
// };

// var levels = {
//   debug: 'debug',
//   info: 'info',
//   notice: 'notice',
//   warning: 'warning',
//   error: 'err',
//   critical: 'crit',
//   alert: 'alert',
//   emergency: 'emergency'
// };
// 

// var messages = [
//   'Post-ironic ugh jean shorts Banksy, bicycle rights Portland stumptown mlkshk aesthetic Intelligentsia sartorial authentic.',
//   'Deep v Thundercats Odd Future, Wes Anderson VHS brunch pour-over cliche Pinterest plaid',
//   'Marfa High Life locavore art party Schlitz umami Thundercats chillwave mumblecore.',
//   'Wes Anderson XOXO yr small batch swag cardigan twee taxidermy pork belly direct trade.',
//   'Listicle literally twee kitsch, wayfarers Wes Anderson quinoa leggings tilde synth 90’s.'
// ];


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
// function rand(min, max) {
//   return Math.floor(Math.random() * (max - min)) + min;
// }

// for(var i = 0; i < 5; i++) {
//   winston.log(
//     Object.keys(levels)[rand(0, Object.keys(levels).length)], 
//     messages[rand(0, messages.length)]
//   );
// }

//console.dir(winston.config.syslog.levels);

