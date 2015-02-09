A bare-bones, real-time view of MarkLogic logs.

![syslog](https://cloud.githubusercontent.com/assets/176233/6114053/88432014-b069-11e4-91fe-ae0d8a210ef8.png)

# Set-up
## Database
1. [Import](http://docs.marklogic.com/guide/admin/config_manager#id_38038) the [Configuration Manager](http://localhost:8002/nav/?type=databases) package, [`db/Logs-config.zip`](db/Logs-config.zip). This will create or update `Logs` and `Logs-Triggers` databases and a `Logs` app server, including the trigger definition and trigger script. These are documented in [`db/create-trigger.xqy`](db/create-trigger.xqy) and [`db/trigger.xqy`](db/trigger.xqy), respectively.
2. Enable syslog logging for MarkLogic app servers by setting the minimum syslog level in the [Group configuration](http://docs.marklogic.com/guide/admin/groups#id_90097).

## syslog Server
Follow the instructions in [marklogic-syslog-server](https://github.com/jmakeig/marklogic-syslog-server) to route syslog messages to the `Logs` database you created above.

## Web Server
1. Start the web server on `localhost` port `3000` with `node marklogic-listener.js`
1. Open [http://localhost:3000/sse.html](http://localhost:3000/sse.html) in your browser

Create some log messages. See an example that can be run in Query Console in [`db/log-synthesizer.sjs`](db/log-synthesizer.sjs).

# License
Copyright 2014 MarkLogic Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.