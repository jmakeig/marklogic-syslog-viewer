function errorAdvice(f, scope) {
  return function() {
    try {
      return f.call(scope || null, arguments);
    } catch(err) {
      fn.error(
        null, 
        'RESTAPI-SRVEXERR', 
        [
          err.code || 500, 
          err.message || 'Unexpected error', 
          error.stack || ''
        ]);
    }
  }
}

module.exports.errorAdvice = errorAdvice;