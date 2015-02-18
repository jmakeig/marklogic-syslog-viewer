var shadow = cts.wordQuery('demo');
var facets = {'severity': ['notice', 'error', 'warning'], 'sender': ['MarkLogic']};
cts.estimate(
  compositeQuery(shadow, facets)
)

/** Combines a shadow query with facets */
function compositeQuery(shadow, facets) {
  if('undefined' === facets) return shadow;
  return cts.andQuery(
    [shadow].concat(
      Object.keys(facets).map(function(facet) {
        return cts.orQuery(
          facets[facet].map(
            function(value){ 
              return cts.jsonPropertyRangeQuery(facet, '=', value);
            }
          )
        );
      })
    )
  );
}


