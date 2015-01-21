// FIXME: <http://bugtrack.marklogic.com/30921> and <http://docs.marklogic.com/guide/app-dev/import_modules#id_29407>
//var resource = require('./resource-helper.sjs'); 
var resource = {}
resource.errorAdvice = function(f, scope) {
  return function() {
    //xdmp.log(arguments);
    try {
      return f.apply(scope || null, arguments);
    } catch(err) {
      fn.error(
        null, 
        'RESTAPI-SRVEXERR', 
        [
          err.code || 500, 
          err.message || 'Unexpected error', 
          error.stack || ''
        ]);
    }
  }
}

var alert = require('/MarkLogic/alert.xqy');

function get(context, params) {
  context.outputStatus = [200, 'Accepted']
  context.outputTypes = ['application/json'];
  var sessionID = params['sessionID'];
  var appID = params['appID'];
  throw new Error('Not implemented');
  return { 
    asdf: 'asdf'
  }
};

function put(context, params, input) {
  var sessionID = params['sessionID'];
  var appID = params['appID'];
  var query = cts.andQuery([]); // Defaults to everything
  
  xdmp.log('CREATING ALERT IN EXTENSION');
  if(input && input.root && input.root.query) { 
    //throw new TypeError('Need to specify a query'); 
    query = input.root.query;
    query = cts.wordQuery(query);
  }
  
  // <alert:options>
  //   <log:session>1234567890</log:session>
  //   <log:app>dummy</log:app>
  // </alert:options>
  var nb = new NodeBuilder();
  nb.startElement("alert:options", "http://marklogic.com/xdmp/alert")
    .startElement("log:session", "http://marklogic.com/jmakeig/logs").addText(sessionID).endElement()
    .startElement("log:app", "http://marklogic.com/jmakeig/logs").addText(appID).endElement()
  .endElement();

  context.outputStatus = [200, 'Hunky dunky']
  context.outputTypes = ['application/json'];
  xdmp.log('Creating rule for session: ' 
    + sessionID + ' app: ' + appID + ' query: ' + query, 'debug');
  
  var rule = alert.makeRule(
   appID + ' ' + sessionID,    //$name as xs:string,
   '',                         //$description as xs:string,
   0,                          //$user-id as xs:unsignedLong,
   query,                      //$query as cts:query,
   'push-http',                //$action as xs:string,
   nb.toNode()                 //$options as element(alert:options)
  ); //as element(alert:rule)
  alert.ruleInsert(
    'logs-alert-config',
    rule
  );
  return null;
};



// Include an export for each method supported by your extension.
exports.GET = resource.errorAdvice(get);
exports.PUT = resource.errorAdvice(put);
