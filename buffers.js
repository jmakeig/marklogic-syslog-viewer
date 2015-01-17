/**
 * Creates a hashmap of TimedBuffer instances with session+app keys.
 */
var Buffers = function(delay, length) {
  this.delay = delay || 1000;
  this.length = length || 25;
  this.buffers = {};
}
/**
 * Get or create a TimedBuffer for the given session and app.
 * @param sessionID string
 * @param appID string
 * @return TimedBuffer Never undefined
 */
Buffers.prototype.get = function(sessionID, appID) {
  var TimedBuffer = require('./timed-buffer.js');
  var key = Buffers.key(sessionID, appID);
  if(!this.buffers[key]) {
    this.buffers[key] = new TimedBuffer(this.delay, this.length);
  }
  return this.buffers[key];
};
/**
 * Encapsulates calculation of compound key.
 */
Buffers.key = function(sessionID, appID) {
  if(!sessionID || !appID) { throw new TypeError('Must provide session and app IDs.'); }
  return sessionID + ' ' + appID;
}

module.exports = Buffers;