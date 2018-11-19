/* Token service
 * Define the REST endpoint for /token
 * This service generates security tokens to validate access to the API for
 * authenticated users.
 *   
 */
'use strict';

// Dependencies
const routes = require('./routes');
const constants = require('./constants');
const helpers = require('./helpers');
const _data = require('./data');

const tokenPath = 'tokens';
const tokenLength = 20;

const tokenService = {};

tokenService.init = function () {

  // create a new token
  routes.add(tokenPath, constants.HTTP_METHOD_POST, function (data, callback) {

    const password = typeof (data.payload.password) === 'string' &&
      data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const email = typeof (data.payload.email) === 'string' &&
      data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

    if (email && password) {
      _data.read('users', email, function(err, data) {
        if (!err && data) {
          if (data.password === helpers.hash(password)) { 
            // If valid create a new token with a random name, 
            // Set expiration date 1 hour in the future
            const tokenId = helpers.generateId(tokenLength);
            const expires = tokenService.getExpiresDateTime();
            const token = {
              'email': email,
              'token': tokenId,
              'expires': expires
            };
            _data.create(tokenPath, tokenId, token, function(err) {
              if (!err) {
                callback(constants.HTTP_STATUS_OK, token);
              } else {
                callback(constants.HTTP_INTERNAL_SERVER_ERROR, {'Error' :
                  `An error occurred while trying to create a new token. ${err}`});
              }
            });
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, {'Error' : 
              'token.post: Provided email or password was incorrect.'});            
          }
        } else {
          callback(constants.HTTP_INTERNAL_SERVER_ERROR, {'Error' : 
            `token.post: An error occurred while trying to read user ${email}. ${err}`});
        }
      });
    } else {
      callback(constants.HTTP_BAD_REQUEST, {'Error' : 
        'token.post: Not all required fields email and password are provided'});
    }
  });

  // Delete the token with the given tokenId
  routes.add(tokenPath, constants.HTTP_METHOD_DELETE, function(data, callback) {
    const tokenId = typeof(data.queryStringObject.token) === 'string' && 
      data.queryStringObject.token.length === tokenLength ? data.queryStringObject.token : false;
    if (tokenId) {
      _data.read(tokenPath, tokenId, function(err, data) {
        if (!err && data) {
          _data.delete(tokenPath, tokenId, function(err) {
            if (!err) {
              callback(constants.HTTP_STATUS_OK);
            } else {
              callback(constants.HTTP_INTERNAL_SERVER_ERROR, {'Error' : 
                `An error occurred while trying to delete the token ${tokenId}.${err}`});
            }
          });
        } else {
          callback(constants.HTTP_STATUS_NOT_FOUND, {'Error' : 
            `Could not find the token ${tokenId}. ${err}`});
        }
      });
    } else {
      callback(constants.HTTP_BAD_REQUEST, {'Error' : 
        'The token to delete should be provided in the querystring'});
    }
  });

  // Update the token by extending the expires date/time
  routes.add(tokenPath, constants.HTTP_METHOD_PUT, function(data, callback) {

    const tokenId = typeof(data.payload.token) === 'string' && 
      data.payload.token.length === tokenLength ? data.payload.token : false;
    const extend = typeof(data.payload.extend) === 'boolean' && 
      data.payload.extend ? true : false;

    if (tokenId && extend) {
      _data.read(tokenPath, tokenId, function(err, data) {
        if (!err && data) {
          if (data.expires > Date.now()) {
            // update the expires field a new expire date time.
            data.expires = tokenService.getExpiresDateTime();
            _data.update(tokenPath, tokenId, data, function (err) {
              if (!err) {
                callback(constants.HTTP_STATUS_OK);
              } else {
                callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                  {'Error' : 
                    `An error occurred while trying to update the token ${tokenId}. ${err}`});
              }
            });
          } else {
            callback(constants.HTTP_BAD_REQUEST, 
              {'Error' : 'Could not update the token, the token is already expired'});
          }
        } else {
          callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
            {'Error' : `An error occurred while trying to read token ${tokenId}. ${err}`});
        }
      });
    } else {
      callback(constants.HTTP_BAD_REQUEST, {'Error' : 'Not all required fields are available'});
    }
  });
};

// Verify if a given token is currently valid for a given user
tokenService.verifyToken = function (token, email, callback) {
  // Lookup the token
  _data.read(tokenPath, token, function (err, data) {
    if (!err && data) {
      if (data.email === email && data.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

tokenService.getExpiresDateTime = function() {
  // Return the current date time one hour in the future.
  return Date.now() + 1000 * 60 * 60;
};

module.exports = tokenService;