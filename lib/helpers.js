/* 
 * Helpers contain helper functions that are too small to .... their own module
 */

'use strict';

// Dependencies
const url = require('url');
const crypto = require('crypto');
const config = require('./config');

const lib = {};

lib.getTrimmedPath = function (rawUrl) {
  const parsedUrl = url.parse(rawUrl, true);
  // return the path name from the url and remove slashes before and after.
  return parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
};

lib.getQueryStringObject = function (rawUrl) {
  const parsedUrl = url.parse(rawUrl, true);
  return parsedUrl.query;
};

// Generate a random string
lib.generateId = function (length) {
  // We generate an hex string, therefore we divide the given length by 2
  return crypto.randomBytes(length / 2).toString('hex').toLowerCase();
};

// Parse a JSON string to an object in all cases, without throwing
lib.parseJsonToObject = function (jsonString) {
  try {
    if (typeof (jsonString) === 'string' && jsonString.length > 0) {
      return JSON.parse(jsonString);
    } else {
      return {};
    }
  } catch (err) {
    console.log(`parseJsonToObject: An error occurred while 
      trying to parse "${jsonString}". ${err}`);
    return {};
  }
};

// Hash the given string
lib.hash = function (stringToHash) {
  if (typeof (stringToHash) === 'string' && stringToHash.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret).update(stringToHash).digest('hex');
  } else {
    return false;
  }
};

lib.validateEmail = function(email) {
  const emailValidationRegEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailValidationRegEx.test(email);
};

module.exports = lib;