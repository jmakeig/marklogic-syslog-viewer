var q = cts.wordQuery('asdf');

/** Converts a query to an XML element node, suitable for including in a NodeBuilder. */
function queryToXML(q) {
  return xdmp.xqueryEval(
    'declare variable $q as cts:query external; <a>{$q}</a>/*', 
    [xs.QName('q'), q]
  ).next().value;
}
  
var nb = new NodeBuilder();
  nb.startElement("alert:options", "http://marklogic.com/xdmp/alert")
    .addNode(queryToXML(q))
  .endElement();
nb.toNode();

