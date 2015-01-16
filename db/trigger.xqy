xquery version "1.0-ml";
import module namespace trgr='http://marklogic.com/xdmp/triggers' at '/MarkLogic/triggers.xqy';

declare variable $trgr:uri as xs:string external;
declare variable $trgr:trigger as node() external;

let $_ := xdmp:log(xdmp:quote(doc($trgr:uri)))
return
  xdmp:http-post("http://localhost:3000/logs",
     <options xmlns="xdmp:http">
       <!--<authentication method="basic">
         <username>myname</username>
         <password>mypassword</password>
       </authentication>-->
       <data>{xdmp:quote(doc($trgr:uri))}</data>
       <headers>
         <content-type>application/json</content-type>
       </headers>
     </options>)