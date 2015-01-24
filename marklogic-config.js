var writer =  {
  database: "Logs",
  host: "localhost",
  port: 3033,
  user: "logs-writer",
  password: "********",
  authType: "DIGEST"
}

var reader =  {
  database: "Logs",
  host: "localhost",
  port: 3033,
  user: "logs-reader",
  password: "********",
  authType: "DIGEST"
}

var admin =  {
  database: "Logs",
  host: "localhost",
  port: 3033,
  user: "logs-admin", 
  password: "********",
  authType: "DIGEST"
}

var sudo =  {
  database: "Logs",
  host: "localhost",
  port: 3033,
  user: "admin", 
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

module.exports = {
  connection: sudo,
  reader: reader,
  writer: writer,
  admin: admin
}
module.exports.sudo = admin;
module.exports.connection = sudo;