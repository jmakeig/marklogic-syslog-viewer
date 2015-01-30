var winston = require('winston');
var PosixSyslog = require('winston-posix-syslog').PosixSyslog;

// winston.config.syslog.levels is backwards (Huh?!)
// <https://github.com/flatiron/winston/commit/651b13e1952cbfc312bd72d26684c7ad552af00f>
// console.dir(winston.config.syslog.levels);
// { 
//   emerg: 0,
//   alert: 1,
//   crit: 2,
//   error: 3,
//   warning: 4,
//   notice: 5,
//   info: 6,
//   debug: 7 
// }

var levels = {
  //'emergency': 7, // Not supported, at least on OS X
  'alert':       6,
  'crit':        5,
  'error':       4,
  'warn':        3,
  'notice':      2,
  'info':        1,
  'debug':       0
};

var syslog = new PosixSyslog();
var log = new winston.Logger({
  levels: levels,
  level: 'debug',
  transports: [syslog, new (winston.transports.Console)()]
});

// This looks to be the only way to effectively let the level threshold
log.transports.console.level  = 'debug';
log.transports.posixSyslog.level = 'info';

for(var level in levels) {
  console.log(level);
  log[level]('Message from syslog: ' + level);
}

