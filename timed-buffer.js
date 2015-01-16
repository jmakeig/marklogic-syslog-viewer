//var util = require('util');
var EventEmitter = require('events').EventEmitter;

function bind(f, that) {
  return function() {
    return f.apply(that, arguments);
  }
}

var TimedBuffer = function(delay, length) {
  this.length = length || 200;
  this.state = [];
  function handleInterval() {
    //console.log("buffer.length: " + this.state.length);
    if(this.state.length) {
      this.emit('flush', this.state);
      this.state = [];
    }
  }
  var inteval = setInterval(bind(handleInterval, this), delay || 1000);
}
//util.inherits(TimedBuffer, EventEmitter);
TimedBuffer.prototype = new EventEmitter;
TimedBuffer.prototype.push = function(value) {
  this.state.push(value);
  if(this.state.length >= this.length) {
    this.emit('flush', this.state);
    this.state = [];
  }
}

module.exports = TimedBuffer;