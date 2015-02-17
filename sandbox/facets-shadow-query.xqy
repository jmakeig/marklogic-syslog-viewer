declare namespace local = "local";
declare function local:facet-frequencies($facets as map:map, $zero as xs:integer?) as map:map {
  let $map as map:map := map:map()
  let $_ := for $k in map:keys($facets)
    return map:put($map, $k, 
      if(exists($zero)) then
        $zero
      else
        cts:frequency(map:get($facets, $k))
    )
  return $map
};
declare function local:facet-frequencies($facets as map:map) as map:map {
  local:facet-frequencies($facets, ())
};

(::
 : Mostly like cts:values, but with an extra shadow query. 
 : Uses a “shadow” query as the basis for the values and then 
 : overlays the frequencies from the regular query. This is useful 
 : when you want the UI to show all possible values, even when there 
 : is none in the current result set.
 :)
declare function local:shadow-values(
  $range-indexes as cts:reference*, 
  $start as xs:anyAtomicType?, 
  $options as xs:string*,
  $query as cts:query?,
  $shadow-query as cts:query?,
  $quality-weight as xs:double?,
  $forest-ids as xs:unsignedLong*
) as map:map {
  let $all as map:map := local:facet-frequencies(cts:values($range-indexes, $start, ("map"), $shadow-query), 0)
  let $some as map:map := local:facet-frequencies(cts:values($range-indexes, $start, ($options, "map"), $query))
  let $map as map:map := map:new($all)
  let $_ := for $k in map:keys($some) return map:put($map, $k, map:get($some, $k))
  return 
    $map
};
declare function local:shadow-values(
  $range-indexes as cts:reference*, 
  $start as xs:anyAtomicType?, 
  $options as xs:string*,
  $query as cts:query?,
  $shadow-query as cts:query?,
  $quality-weight as xs:double?
) as map:map {
  local:shadow-values($range-indexes, $start, $options, $query, $shadow-query, $quality-weight, ())
};
declare function local:shadow-values(
  $range-indexes as cts:reference*, 
  $start as xs:anyAtomicType?, 
  $options as xs:string*,
  $query as cts:query?,
  $shadow-query as cts:query?
) as map:map {
  local:shadow-values($range-indexes, $start, $options, $query, $shadow-query, (), ())
};

let $shadow-query as cts:query := cts:collection-query("logs")
let $query as cts:query := cts:and-query((cts:collection-query("logs"), cts:word-query("task*")))
return 
  xdmp:to-json(
    local:shadow-values(cts:json-property-reference("sender"), (), (), $query, $shadow-query)
  )
  
(:
  {
    "taskgated": 4,
    "node": 0,
    "Other": 0,
    "MarkLogic": 30832
  }
:)