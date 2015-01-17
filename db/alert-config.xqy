(:
xquery version "1.0-ml";
xdmp:forest-clear(
  (
    xdmp:database-forests(xdmp:database('Logs')),
    xdmp:database-forests(xdmp:database('Logs-Triggers'))
  )
)

;
:)
xquery version "1.0-ml";
import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

let $config := alert:make-config(
  "logs-alert-config",
  "logs",
  "syslog storage and query",
    <alert:options>
      <alert:unfiltered>false</alert:unfiltered><!-- Can't seem to get unfiltered to work -->
    </alert:options>
)
return
  alert:config-insert($config)
  
;

xquery version "1.0-ml";
import module namespace alert = "http://marklogic.com/xdmp/alert" 
		  at "/MarkLogic/alert.xqy";

let $action := alert:make-action(
    "push-http", 
    "Push log message over HTTP",
    xdmp:modules-database(),
    xdmp:modules-root(), 
    "/actions/logs-push-http.xqy",
    <alert:options/> )
return
  alert:action-insert("logs-alert-config", $action)
  
;

xquery version "1.0-ml";
import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";

let $uri := "logs-alert-config"
let $trigger-ids := alert:create-triggers (
  $uri,
  trgr:trigger-data-event(
    trgr:collection-scope("logs"),
    trgr:document-content("create"),
    trgr:post-commit()
  )
)

return alert:config-insert(
  alert:config-set-trigger-ids(
    alert:config-get($uri), 
    $trigger-ids
  )
)

;

xquery version "1.0-ml";
import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
declare namespace log = "http://marklogic.com/jmakeig/logs";

let $rule := alert:make-rule(
  "session-1234", 
  "Callback for session-1234",
  0, (: equivalent to xdmp:user(xdmp:get-current-user()) :)
  cts:word-query("asdf"),
  "push-http", (: action :)
  <alert:options>
    <log:session>1234</log:session>
  </alert:options>)
return
  alert:rule-insert("logs-alert-config", $rule)