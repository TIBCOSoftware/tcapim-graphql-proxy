/** 
* Copyright 2022. TIBCO Software Inc.
* This file is subject to the license terms contained
* in the license file that is distributed with this file.
*/

"use strict";

const Express = require("express");
const Logger = require("./logger");
const fs = require("fs");
const GraphQl = require("graphql");
const DepthLimit = require("graphql-depth-limit");
const path = require("path");

const port = 8000;
let schema; // used for validation rules

const app = Express();
app.use(Express.text({ type: "*/*" }));

app.post("/preprocessor", function (req, res) {
  let requestId;
  let src_ip;
  let RESTRICTED_OBJECTS;
  let MAX_QUERY_DEPTH = process.env.MAX_QUERY_DEPTH;
  let ALLOW_INTROSPECT = process.env.ALLOW_INTROSPECT;
  let ALLOW_MUTATION = process.env.ALLOW_MUTATION;

  let reqBody = JSON.parse(Buffer.from(req.body, "base64"));
  let payload = JSON.parse(Buffer.from(reqBody.bodyContent.content, "base64"));

  for (let ele in reqBody.headers) {
    if (reqBody.headers[ele].name == "X-Mashery-Message-ID") 
      requestId = reqBody.headers[ele].value;
    if (reqBody.headers[ele].name == "X-Forwarded-For") 
      src_ip = reqBody.headers[ele].value;
  }
  for (let ele in reqBody.packageKeyFields) {
    if (reqBody.packageKeyFields[ele].name == "max_query_depth")
      MAX_QUERY_DEPTH = reqBody.packageKeyFields[ele].value;
    if (reqBody.packageKeyFields[ele].name == "allow_introspection") 
      ALLOW_INTROSPECT = reqBody.packageKeyFields[ele].value;
    if (reqBody.packageKeyFields[ele].name == "allow_mutation") 
      ALLOW_MUTATION = reqBody.packageKeyFields[ele].value;
    if (reqBody.packageKeyFields[ele].name == "restricted_objects") 
      RESTRICTED_OBJECTS = reqBody.packageKeyFields[ele].value;
    if (RESTRICTED_OBJECTS == null) 
      RESTRICTED_OBJECTS = "";
  }

  let doc;
  try {
    let src = new GraphQl.Source(payload.query, "gql");
    doc = GraphQl.parse(src);
  } catch (e) {
    Logger.log(Logger.LOG_INFO, "RequestID: " + requestId + " SourceIP: " + src_ip + " Status: Invalid GrapqhQL query");
    return res.status(400).send({
      message: "Invalid GrapqhQL query",
    });
  }  

  let defaultRules = new GraphQl.validate(schema, doc);
  if (defaultRules.length > 0) {
    Logger.log(Logger.LOG_INFO, "RequestID: " + requestId + " SourceIP: " + src_ip + " Status: Invalid GrapqhQL query");
    return res.status(400).send({
      message: "Invalid GrapqhQL query",
    });
  }

  if (JSON.stringify(payload.query).includes("mutation") && !JSON.stringify(payload.query).includes("_schema") && ALLOW_MUTATION == false) {
    Logger.log(Logger.LOG_INFO, "RequestID: " + requestId + " SourceIP: " + src_ip + " Status: Blocked mutation query");
    return res.status(400).send({
      message: "Mutation is disabled",
    });
  }
  if (JSON.stringify(payload.query).includes("subscription") && !JSON.stringify(payload.query).includes("_schema")) {
    Logger.log(Logger.LOG_INFO, "RequestID: " + requestId + " SourceIP: " + src_ip + " Status: Blocked subscription query");
    return res.status(400).send({
      message: "Subscription is not supported",
    });
  }
  // if Introspection is disabled
  let introspectionRule = new GraphQl.validate(schema, doc, [GraphQl.NoSchemaIntrospectionCustomRule]);
  if (ALLOW_INTROSPECT == false && introspectionRule.length > 0) {
    Logger.log(Logger.LOG_INFO, "RequestID: " + requestId + " SourceIP: " + src_ip + " Status: Blocked introspection query");
    return res.status(400).send({
      message: "Introspection Queries are disabled",
    });
  }

  // depth limit rules
  // skip check if MAX_QUERY_DEPTH is 0
  if (MAX_QUERY_DEPTH > 0) {
    let depthLimitRule = new GraphQl.validate(schema, doc, [DepthLimit(MAX_QUERY_DEPTH)]);
    if (depthLimitRule.length > 0) {
      Logger.log(Logger.LOG_INFO, "RequestID: " + requestId + " SourceIP: " + src_ip + " Status: Query exceeds max depth of " + MAX_QUERY_DEPTH);
      return res.status(400).send({
        message: "Query exceeds max depth of " + MAX_QUERY_DEPTH,
      });
    }
  }

  let restrictedObjects = RESTRICTED_OBJECTS.split(",");
  if(restrictedObjects.length>0){    
  let objects =[]; // array of all objects in the query.
  let getFields = function (sel) {
    if(objects.indexOf(sel.name.value) === -1)
      objects.push(sel.name.value);
    try {
      if (sel.selectionSet.selections.length > 0) {
        for (let element in sel.selectionSet.selections) getFields(sel.selectionSet.selections[element]);
      }
    } catch (e) {      
    }
  };
  for (let def in doc.definitions) {
    try {
      if (doc.definitions[def].selectionSet.selections.length > 0)
        for (let element in doc.definitions[def].selectionSet.selections) {
          getFields(doc.definitions[def].selectionSet.selections[element]);
        }
    } catch (e) {     
    }
  }
    // check if fields contain the restricted objects
    for (let ele in objects) {
      if (restrictedObjects.includes(objects[ele])) {
        Logger.log(Logger.LOG_INFO,"RequestID: " + requestId + " SourceIP: " + src_ip + " Status: Restricted object in the query - " + objects[ele]);
        return res.status(400).send({
          message: "Restricted object in the query: " + objects[ele],
        });
      }
    }  
}
  //**/
  Logger.log(Logger.LOG_INFO, "RequestID: " + requestId + " SourceIP: " + src_ip + " Status: OK");
  return res.send();
});

app.listen(port, () => {
  /* eslint-disable no-console */
  schema = GraphQl.buildSchema(fs.readFileSync(path.join(__dirname, "config/schema.graphql"), "utf-8"));  
  Logger.log(Logger.LOG_INFO, "Started Application on http://:" + port + "/preprocessor");
  /* eslint-disable no-console */
});
