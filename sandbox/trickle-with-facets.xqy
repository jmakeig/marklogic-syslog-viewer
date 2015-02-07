declare namespace alert = "http://marklogic.com/xdmp/alert";
declare namespace local = "local";

(: Assembles a JSON payload with a message and updated facets :)

declare function local:facets($query as cts:query) as json:object {
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

let $query as cts:query := cts:query((/alert:rule)[1]/alert:query/cts:*)
let $out as map:map := map:map()
let $_ := (
  map:put($out, "facets", local:facets($query)),
  map:put($out, "message", (collection('logs'))[1])
)
return
  xdmp:to-json($out)