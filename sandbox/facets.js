var Promise = require('bluebird');
var marklogic = require('marklogic');
var conn = require('../marklogic-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var qb = marklogic.queryBuilder;

var queryString = '';

var constraints = {
  sender: ['taskgated'],
  severity: ['error', 'info', 'notice', 'warning', 'debug']
}

var where = [qb.collection('logs')];
if(queryString) {
  where.push(
    qb.parsedFrom(queryString,
      qb.parseBindings( 
        qb.word('host', qb.bind('h')),
        qb.value('severity', qb.bind('l')),
        qb.word('sender', qb.bind('s'))
      )
    )
  );
}
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
    .slice(1, 4, qb.snippet()) /* First result will be metadata, including snippets, the rest will be the documents */
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
  // console.log('Running in transaction %d', txid);
  Promise.join(
    getResults(where, txid),
    getFacet('sender', where, txid),
    getFacet('host', where, txid),
    getFacet('severity', where, txid),
    function(results, senders, hosts, severities) {
      var out = Object.create(null);
      out.meta = results[0];
      out.docs = results.slice(1);
      out.facets = {};
      out.facets.sender = senders[0].facets.sender;
      out.facets.host = hosts[0].facets.host;
      out.facets.severity = severities[0].facets.severity;
      console.log(JSON.stringify(out));
      // console.log('%j', results);
      // console.log('*****************************************');
      // console.log('%j', senders);
      // console.log('*****************************************');
      // console.log('%j', hosts);
      // console.log('*****************************************');
      // console.log('%j', severities);
      
      // console.log(JSON.stringify(
      //   Array.prototype.slice.apply(arguments).map(function(r) {
      //     if(Array.isArray(r) && r.length > 0) {
      //       var item = r[0];
      //       if('undefined' !== typeof item.facets) {
      //         return item.facets;
      //       }
      //     }
      //     return r;
      //   })
      // ));
    }
  )
}).catch(function(error) {
  console.log('%j', error);
});
