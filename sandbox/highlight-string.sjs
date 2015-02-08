highlightString(
  'TaskServer: XDMP-UNSEARCHABLE: xdmp:estimate(cts:collection-query("logs")) -- Expression is unsearchable',
  cts.wordQuery('xdmp')
)
function highlightString(text, query) {
  var xquery =  [
    'declare variable $messageText as xs:string external;',
    'declare variable $query as cts:query external;',
    'let $msg as element() := <msg>{$messageText}</msg>',
    'return cts:highlight($msg, $query, <em>{$cts:text}</em>)/node()'
    ].join('\n');
  var itr = xdmp.xqueryEval(
   xquery, 
    {
      messageText: text,
      query: query
    }
  );
  var arr = [];
  for(var el of itr) {
     arr.push(xdmp.quote(el));
  }
  return arr.join(' ');
}