function tx(f, database, modules, root) {
  return xdmp.invokeFunction(
    f, 
    { 
      "database": database ? xdmp.database(database) : xdmp.database(), 
      "transactionMode": "update-auto-commit", 
      "isolation": "different-transaction"
    }
  );
}

for(var i = 0; i < 25; i++) {
  tx(function() { xdmp.log('test', 'info') });
}