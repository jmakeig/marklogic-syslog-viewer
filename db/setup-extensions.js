var fs = require('fs');
var marklogic = require('marklogic');
var conn = require('../marklogic-config.js').connection;

var db = marklogic.createDatabaseClient(conn);
// Gets installed into the Modules database, by default for 8000
db.config.resources.write({
  name: 'alerts',
  format: 'javascript',
  source: fs.createReadStream(__dirname + '/extensions/resources/query-alert.sjs'),
  // everything below this is optional metadata
  title: 'Creates or updates alerts',
  permissions: [
    { 'role-name': 'logs-reader', capabilities : ['execute'] },
    { 'role-name': 'logs-writer', capabilities : ['insert', 'update'] }
  ]
}).result(function(response) {
  console.log('Installed extension "%s"', response.name);
}, function(error) {
  console.log(JSON.stringify(error, null, 2));
});

db.documents.write({
  uri: 'logs-alert-config/action-push-http.xqy',
  content: fs.readFileSync(__dirname + '/modules/actions/logs-push-http.xqy', {encoding: 'utf8'}),
  permissions: [
    { 'role-name': 'logs-reader', capabilities : ['read', 'execute'] },
    { 'role-name': 'logs-writer', capabilities : ['insert', 'update'] }
  ]
})
  .result(function(response) { console.log('Wrote %s', response.documents[0].uri); });
