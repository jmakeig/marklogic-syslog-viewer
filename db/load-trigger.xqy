xquery version "1.0-ml";
(:xdmp:document-delete('/modules/trigger-create.xqy');:)
xdmp:document-load("/Users/jmakeig/Workspaces/log-viewer/db/trigger.xqy",
  <options xmlns="xdmp:document-load">
    <uri>/modules/log.xqy</uri>
    <format>text</format>
    <permissions>{xdmp:default-permissions()}</permissions>
  </options>)
