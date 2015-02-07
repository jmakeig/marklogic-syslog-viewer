xquery version "1.0-ml";
declare namespace alert = "http://marklogic.com/xdmp/alert";
declare namespace log = "http://marklogic.com/jmakeig/logs";

declare variable $alert:config-uri as xs:string external;
declare variable $alert:doc as node() external;
declare variable $alert:rule as element(alert:rule) external;
declare variable $alert:action as element(alert:action) external;

declare variable $host as xs:string := "http://localhost:3000";

(: Assembles a JSON payload with a message and updated facets :)

declare function log:facets($query as cts:query) as json:object {
  let $facets as xs:string* := ('sender', 'host', 'severity')
  let $out as map:map := map:map()
  let $_ :=
    for $facet in $facets
    return
      map:put($out, $facet, 
        object-node { 'facetValues': 
          json:to-array(
            for $f in cts:values(cts:json-property-reference($facet), (), (), $query)
            return
              object-node {
                'name': $f,
                'value': $f,
                'count': cts:frequency($f)
              }
          )
        }
      )
  return xdmp:to-json($out)
};



(: Yikes! This will cause an infinite loop of logs for log levels. :)
(: Make sure the minimum syslog threshold is above debug, e.g. config. :)
(: 
  xdmp:log(
  xdmp:quote($alert:doc),
  'debug'
  ),
:)

let $out as map:map := map:map()
let $_ := (
  map:put($out, "facets", log:facets(cts:query($alert:rule/alert:query/cts:*))),
  map:put($out, "message", $alert:doc)
)

(: FIXME: If the response is 404 remove the alert rule. Ba-zing! :)
let $response as item()+ := xdmp:http-post(
  $host 
  ||"/logs/" 
  || $alert:rule/alert:options/log:session
  || "/"
  || $alert:rule/alert:options/log:app,
   <options xmlns="xdmp:http">
     <!--<authentication method="basic">
       <username>myname</username>
       <password>mypassword</password>
     </authentication>-->
     <data>{xdmp:quote(xdmp:to-json($out))}</data>
     <headers>
       <content-type>application/json</content-type>
     </headers>
   </options>)
return ()