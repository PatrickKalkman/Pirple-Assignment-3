'use strict';
/* Start up the http server */

// Dependencies
const http = require('http');
const https = require('https');
const utils = require('util');
const debug = utils.debuglog('index');
const fs = require('fs');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;

const config = require('./config');
const helpers = require('./helpers');
const routes = require('./routes');
const constants = require('./constants');
const userService = require('./userService');
const tokenService = require('./tokenService');
const menuService = require('./menuService');
const shoppingCartService = require('./shoppingCartService');
const orderService = require('./orderService');

const server = {};

// Instantiate the https server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res) {
  server.unifiedServer(req, res);
});

server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.unifiedServer = function (req, res) {
  // get the payload, if there is any
  const decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });

  req.on('end', function () {
    buffer += decoder.end();

    const data = {};
    data.httpMethod = req.method.toLowerCase();
    data.trimmedPath = helpers.getTrimmedPath(req.url);
    data.payload = helpers.parseJsonToObject(buffer);
    data.queryStringObject = helpers.getQueryStringObject(req.url);
    data.headers = req.headers;

    routes.handle(data, function (statusCode, responsePayload) {
      responsePayload = typeof (responsePayload) === 'object' ? responsePayload : {};
      const responsePayloadString = JSON.stringify(responsePayload);
      res.setHeader('content-type', 'application/json');
      res.writeHead(statusCode);
      res.end(responsePayloadString);

      if (statusCode === constants.HTTP_STATUS_OK) {
        debug('\x1b[32m%s\x1b[0m', data.httpMethod.toUpperCase() + ' /' +
          data.trimmedPath + ' ' + statusCode);
      } else {
        debug('\x1b[31m%s\x1b[0m', data.httpMethod.toUpperCase() + ' /' +
          data.trimmedPath + ' ' + statusCode);
      }
      // log the requested path
      debug('Returning ', statusCode, responsePayloadString);
    });
  });
};

server.init = function () {

  // Initialize all the services to let them add the necessary routes.
  userService.init();
  tokenService.init();
  menuService.init();
  shoppingCartService.init();
  orderService.init();

  // Start the http server, and have it listen 
  server.httpServer.listen(config.httpport, function () {
    console.log('\x1b[36m%s\x1b[0m', 
      `The http server is running in ${config.envName} and listening on port ${config.httpport}`);
  });

  // Start the https server
  server.httpsServer.listen(config.httpsport, function () {
    console.log('\x1b[35m%s\x1b[0m', 
      `The https server is running in ${config.envName} and listening on port ${config.httpsport}`);
  });
};

module.exports = server;