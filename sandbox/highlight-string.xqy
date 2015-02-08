declare namespace log="log";
declare function log:highlight-string($txt, $q as cts:query) {
  let $msg as element() := <msg>{string($txt)}</msg>
  return string-join(cts:highlight($msg, $q, <em>{$cts:text}</em>)/node()/xdmp:quote(.), ' ')
};

(:declare variable $messageText as xs:string external;:)
let $messageText as xs:string := "TaskServer: XDMP-UNSEARCHABLE: xdmp:estimate(cts:collection-query(""logs"")) -- Expression is unsearchable"
(:declare variable $query as cts:query external;:)
let $query as cts:query := cts:word-query("xdmp")
return log:highlight-string($messageText, $query)