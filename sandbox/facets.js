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

for(var c in constraints) {
  where.push(
    qb.or(
      constraints[c].map(function(val) {
        return qb.value(c, val);
      })
    )
  );
}

//console.log('%j', where);

db.documents.query(
  qb.where(where)
  .calculate(
    qb.facet('sender'),
    qb.facet('host'),
    qb.facet('severity')
  )
  .slice(0)
)
.result(function(response) {
  console.log(JSON.stringify(response, null, 2));
});

/*
{
  "sender": {
    "type": "xs:string",
    "facetValues": [
      {
        "name": "MarkLogic",
        "count": 452,
        "value": "MarkLogic"
      },
      {
        "name": "node",
        "count": 254,
        "value": "node"
      }
    ]
  },
  "host": {
    "type": "xs:string",
    "facetValues": [
      {
        "name": "MacPro-2600",
        "count": 706,
        "value": "MacPro-2600"
      }
    ]
  },
  "severity": {
    "type": "xs:string",
    "facetValues": [
      {
        "name": "alert",
        "count": 24,
        "value": "alert"
      },
      {
        "name": "critical",
        "count": 27,
        "value": "critical"
      },
      {
        "name": "debug",
        "count": 44,
        "value": "debug"
      },
      {
        "name": "emergency",
        "count": 1,
        "value": "emergency"
      },
      {
        "name": "error",
        "count": 38,
        "value": "error"
      },
      {
        "name": "info",
        "count": 94,
        "value": "info"
      },
      {
        "name": "notice",
        "count": 40,
        "value": "notice"
      },
      {
        "name": "warning",
        "count": 438,
        "value": "warning"
      }
    ]
  }
}
*/
  
  