// FIXME: <http://bugtrack.marklogic.com/30921> and <http://docs.marklogic.com/guide/app-dev/import_modules#id_29407>
var resource = require('./extensions/resources/resource-helper.sjs'); 
var alert = require('/MarkLogic/alert.xqy');

function get(context, params) {
  context.outputStatus = [200, 'Accepted']
  context.outputTypes = ['application/json'];
  var sessionID = params['sessionID'];
  var appID = params['appID'];
  
  return { 
    asdf: 'asdf'
  }
};

function put(context, params, input) {
  var sessionID = params['sessionID'];
  var appID = params['appID'];
  var query = params['query'];
  
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
  return alert.makeRule(
   appID + ' ' + sessionID,    //$name as xs:string,
   '',                         //$description as xs:string,
   0,                          //$user-id as xs:unsignedLong,
   cts.wordQuery(query),       //$query as cts:query,
   'push-http',                //$action as xs:string,
   nb.toNode()                 //$options as element(alert:options)
  ); //as element(alert:rule)
};



// Include an export for each method supported by your extension.
exports.GET = resource.errorAdvice(get);
exports.PUT = put; //resource.errorAdvice(put);
