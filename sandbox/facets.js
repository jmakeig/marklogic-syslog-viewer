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

//console.log('%j', where.concat(queryFromConstraints(constraints)));
//process.exit(0);

db.documents.query(
  qb.where(
    where.concat(queryFromConstraints(constraints))
  )
  .calculate(
    qb.facet('sender'),
    qb.facet('host'),
    qb.facet('severity')
  )
  .slice(0)
)
.result(
  function(response) {
    console.log(JSON.stringify(response, null, 2));
  },
  function(error) {
    console.error(error);
  }
);

/*
[
  {
    "snippet-format": "empty-snippet",
    "total": 598,
    "start": 1,
    "page-length": 0,
    "results": [],
    "facets": {
      "sender": {
        "type": "xs:string",
        "facetValues": [
          {
            "name": "MarkLogic",
            "count": 598,
            "value": "MarkLogic"
          }
        ]
      },
      "host": {
        "type": "xs:string",
        "facetValues": [
          {
            "name": "MacPro-2600",
            "count": 598,
            "value": "MacPro-2600"
          }
        ]
      },
      "severity": {
        "type": "xs:string",
        "facetValues": [
          {
            "name": "error",
            "count": 27,
            "value": "error"
          },
          {
            "name": "warning",
            "count": 571,
            "value": "warning"
          }
        ]
      }
    }
  }
]
*/