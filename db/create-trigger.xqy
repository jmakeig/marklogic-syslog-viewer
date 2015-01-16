xquery version "1.0-ml";
import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";

trgr:create-trigger(
  "log", (: name :)
  "Fires when documents are added to the logs collection",  (: description :)
  trgr:trigger-data-event(
      trgr:collection-scope("logs"),
      trgr:document-content("create"),
      trgr:post-commit()
  ), (: event :)
  trgr:trigger-module(xdmp:database("Logs-Triggers"), "/modules/", "trigger-create.xqy"), (: module :)
  fn:true(), (: enabled :)
  xdmp:default-permissions() (: permissions :)
)
