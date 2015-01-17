xquery version "1.0-ml";
declare namespace alert = "http://marklogic.com/xdmp/alert";
declare namespace log = "http://marklogic.com/jmakeig/logs";

declare variable $alert:config-uri as xs:string external;
declare variable $alert:doc as node() external;
declare variable $alert:rule as element(alert:rule) external;
declare variable $alert:action as element(alert:action) external;

( 
  (: Yikes! This will cause an infinite loop of logs for log levels. :)
  (: Make sure the minimum syslog threshold is above debug, e.g. config. :)
  xdmp:log(
    xdmp:quote($alert:doc),
    'debug'
  ),
  xdmp:http-post(
    "http://localhost:3000/logs/" 
    || $alert:rule/alert:options/log:session
    || "/"
    || $alert:rule/alert:options/log:app,
     <options xmlns="xdmp:http">
       <!--<authentication method="basic">
         <username>myname</username>
         <password>mypassword</password>
       </authentication>-->
       <data>{xdmp:quote($alert:doc)}</data>
       <headers>
         <content-type>application/json</content-type>
       </headers>
     </options>)
)