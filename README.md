A bare-bones, real-time view of MarkLogic logs.

# Set-up
## Database
1. Import and apply the Configuration Manager package, `db/Logs-config.zip`. This will create or update `Logs` and `Logs-Triggers` databases and a `Logs` app server, including the trigger definition and trigger script. These are documented in `db/create-trigger.xqy` and `db/trigger.xqy`, respectively.
2. Enable syslog logging by setting the minimum syslog level in the Group configuration.

## syslog Server
Follow the instructions in [marklogic-syslog-server](https://github.com/jmakeig/marklogic-syslog-server) to listen to route syslog messages to the `Logs` database you created above.

## Web Server
1. Start the web server on `localhost` port `3000`, `node marklogic-listener.js`
1. Open `http://localhost:3000/sse.html` in your browser

Create some log messages. See an example that can be run in Query Console in [`db/log-synthesizer.sjs`](db/log-synthesizer.sjs).

# License
Apache 2.0