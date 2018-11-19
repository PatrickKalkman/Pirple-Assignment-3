/* 
 * Routes defines all the routes that are registered with this API
 * The routes are added by the services during initialization.
 *
 */

'use strict';

// Dependencies
const constants = require('./constants');

const lib = {};

const routes = {};

lib.add = function (path, httpMethod, handler) {
  routes[path] = typeof (routes[path]) === 'object' ? routes[path] : {};
  routes[path][httpMethod] = handler;
};

lib.handle = function (data, callback) {

  var handler = lib.notFoundHandler;

  if (routes[data.trimmedPath] !== undefined) {
    if (routes[data.trimmedPath][data.httpMethod] !== undefined) {
      handler = routes[data.trimmedPath][data.httpMethod];
    }
  }

  handler(data, callback);
};

lib.notFoundHandler = function (data, callback) {
  callback(constants.HTTP_STATUS_NOT_FOUND, {});
};

module.exports = lib;