var marklogic = require('marklogic');
var conn = require('../marklogic-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var qb = marklogic.queryBuilder;

var query = 'asdf';

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
  .slice(1, 5) // FIXME: Set this from the UI
  .calculate(
    qb.facet('sender'),
    qb.facet('host'),
    qb.facet('severity')
  )
)
  .result(
    function(response) {
      console.log('%j', response.slice(1));
    },
    function(error) {
      console.error(error);
    }
  );