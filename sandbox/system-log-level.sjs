var admin = require('/MarkLogic/admin.xqy');

// GET
//
// This function returns a document node corresponding to each
// user-defined parameter in order to demonstrate the following
// aspects of implementing REST extensions:
// - Returning multiple documents
// - Overriding the default response code
// - Setting additional response headers
//
function get(context, params) {
  var config = admin.getConfiguration();
  var groupid = admin.groupGetId(config, params.group);
  context.outputStatus = [200, 'Accepted']
  context.outputTypes = ['application/json'];
  return { 
    group: params.group,
    level: admin.groupGetSystemLogLevel(config);
  }
};

// PUT
//
// The client should pass in one or more documents, and for each
// document supplied, a value for the 'basename' request parameter.
// The function inserts the input documents into the database only 
// if the input type is JSON or XML. Input JSON documents have a
// property added to them prior to insertion.
//
// Take note of the following aspects of this function:
// - The 'input' param might be a document node or a ValueIterator
//   over document nodes. You can normalize the values so your
//   code can always assume a ValueIterator.
// - The value of a caller-supplied parameter (basename, in this case)
//   might be a single value or an array.
// - context.inputTypes is always an array
// - How to return an error report to the client
//
function put(context, params, input) {
  // var params = {
  //   group: 'Default',
  //   level: 'notice'
  // }

  var config = admin.getConfiguration();
  var groupid = admin.groupGetId(config, params.group);
  admin.saveConfiguration(
    admin.groupSetSystemLogLevel(config, groupid, params.level)
  );

  context.outputStatus = [200, 'Accepted']
  context.outputTypes = ['application/json'];
  return { level: params.level };
};


// Helper function that demonstrates how to return an error response
// to the client.

// You MUST use fn.error in exactly this way to return an error to the
// client. Raising exceptions or calling fn.error in another manner
// returns a 500 (Internal Server Error) response to the client.
function returnErrToClient(statusCode, statusMsg, body)
{
  fn.error(null, 'RESTAPI-SRVEXERR', [statusCode, statusMsg, body]);
  // unreachable - control does not return from fn.error.
};


// Include an export for each method supported by your extension.
exports.GET = get;
exports.PUT = put;
