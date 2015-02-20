var Promise = require('bluebird');
var marklogic = require('marklogic');
var conn = require('../marklogic-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var qb = marklogic.queryBuilder;

var queryString = '';

var constraints = {
  "sender": ["MarkLogic"],
  "severity": ["error", "warning"]
}

var where = [
  qb.parsedFrom(queryString ,
    qb.parseBindings( 
      qb.word('host', qb.bind('h')),
      qb.value('severity', qb.bind('l')),
      qb.word('sender', qb.bind('s'))
    )
  ),
  qb.collection('logs')
];

function queryFromConstraints(constraints) {
  var where = [];
  if('undefined' === typeof constraints || null === constraints) { return where; }
  for(var c in constraints) {
    where.push(
      qb.or(
        constraints[c].map(function(val) {
          return qb.value(c, val);
        })
      )
    );
  }
  return where;
}

function getResults(where, txid) {
  return db.documents.query(
    qb.where(
      where.concat(queryFromConstraints(constraints))
    )
    .slice(5)
    .withOptions({txid: txid})
  )
  .result();
}

function getFacet(constraint, where, txid) {
  var pruned = Object.create(null);
  for(var p in constraints) {
    if(constraint !== p) {
      pruned[p] = constraints[p];
    }
  }
  
  return db.documents.query(
    qb.where(
      where.concat(queryFromConstraints(pruned))
    )
    .calculate(
      qb.facet(constraint)
    )
    .slice(0)
    .withOptions({txid: txid})
  )
  .result();
}

function getTransaction() {
  return db.transactions.open().result()
  // FIXME: Why doesn't the disposer work?
  // <https://github.com/petkaantonov/bluebird/blob/master/API.md#disposerfunction-disposer---disposer>
  // .disposer(
  //   function(txn) {
  //     console.log('Closing transaction %d', txn.txid);
  //   }
  // )
  ;
}

Promise.using(getTransaction(), function(txn) {
  var txid = txn.txid;
  Promise.join(
    getResults(where, txid),
    getFacet('sender', where, txid),
    getFacet('host', where, txid),
    getFacet('severity', where, txid),
    function(results, senders, hosts, severities) {
      console.log('%j', results);
      console.log('*****************************************');
      console.log('%j', senders);
      console.log('*****************************************');
      console.log('%j', hosts);
      console.log('*****************************************');
      console.log('%j', severities);
    }
  )
}).catch(function(error) {
  console.log('%j', error);
});
