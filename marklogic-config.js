var dev =  {
  database: "Logs",
  host: "localhost",
  port: 3033,
  user: "logs-writer", // TODO: Expose reader too
  password: "********",
  authType: "DIGEST"
}

var OLD =  {
  database: "Logs",
  host: "localhost",
  port: 8000,
  user: "admin",
  password: "********",
  authType: "DIGEST"
}

// Another connection. Change the module.exports below to 
// use it without having to change consuming code.
var test =  {
  database: "Documents",
  host: "acceptance.example.com",
  port: 9116,
  user: "app-writer",
  password: "********",
  authType: "DIGEST"
}

module.exports.connection = dev;