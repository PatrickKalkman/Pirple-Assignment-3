/* User service
 * Define the REST endpoint for /users
 *
 */
'use strict';

// Dependencies
const routes = require('./routes');
const constants = require('./constants');
const _data = require('./data');
const helpers = require('./helpers');
const tokenService = require('./tokenService');

const usersPath = 'users';

const userService = {};

userService.init = function() {
  
  // create a new user
  routes.add(usersPath, constants.HTTP_METHOD_POST, function (data, callback) {

    const firstName = typeof(data.payload.firstName) === 'string' && 
      data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName =  typeof(data.payload.lastName) === 'string' && 
      data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof (data.payload.password) === 'string' && 
      data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const email = typeof (data.payload.email) === 'string' && 
      data.payload.email.trim().length > 0 && 
      helpers.validateEmail(data.payload.email.trim()) ? data.payload.email.trim() : false;
    const tosAgreement = typeof (data.payload.tosAgreement) === 'boolean' && 
      data.payload.tosAgreement ? true : false;

    if (firstName && lastName && password && email && tosAgreement) {

      var userObject = {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': helpers.hash(password),
        'tosAgreement': true
      };

      _data.create(usersPath, email, userObject, function(err) {
        if (!err) {
          callback(constants.HTTP_STATUS_OK);
        } else {
          callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
            {'Error' : `users.post: Cound not create the user with email ${email}. ${err}`});
        }
      });
    } else {
      callback(constants.HTTP_BAD_REQUEST, 
        {'Error' : 'users.post: Required fields were not provided and/or given email was not valid.'});
    }
  });
  
  // Read the user details using the given email address
  routes.add(usersPath, constants.HTTP_METHOD_GET, function (data, callback) {
    const email = typeof (data.queryStringObject.email) === 'string' && 
      data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.read(usersPath, email, function(err, data) {
              if (!err && data) {
                // Do not return the hashed password, it is not needed
                delete data.password;
                callback(constants.HTTP_STATUS_OK, data);
              } else {
                callback(constants.HTTP_STATUS_NOT_FOUND);
              }
            });
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'users.get: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'users.get: Missing authentication token'});
      }
    } else {
        callback(constants.HTTP_BAD_REQUEST, 
          {'Error' : 'users.get: Missing required field, email.'});
    }
  });

  // Delete the user with the given email address
  routes.add(usersPath, constants.HTTP_METHOD_DELETE, function(data, callback) {
    const email = typeof (data.queryStringObject.email) === 'string' && 
      data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {

      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.read(usersPath, email, function(err, data) {
              if (!err && data) {
                _data.delete(usersPath, email, function(err) {
                  if (!err) {
                    callback(constants.HTTP_STATUS_OK);
                  } else {
                    callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                      {'Error' : `users.delete: An error occurred while trying to delete the user ${email}. ${err}`});
                  }
                });
              } else {
                callback(constants.HTTP_STATUS_NOT_FOUND);
              }
            });            
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'users.delete: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'users.delete: Missing authentication token'});
      }
    } else {
        callback(constants.HTTP_BAD_REQUEST, 
          {'Error' : 'users.delete: No email address provided'});
    } 
  });

  // Update the user, if at least the email and a field to update is provided.
  routes.add(usersPath, constants.HTTP_METHOD_PUT, function(data, callback) {
    const firstName = typeof(data.payload.firstName) === 'string' && 
      data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName =  typeof(data.payload.lastName) === 'string' && 
      data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof (data.payload.password) === 'string' && 
      data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const email = typeof (data.payload.email) === 'string' && 
      data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    
    if (email && (firstName || lastName || password)) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.read(usersPath, email, function(err, originalUserData) {
              if (!err && data) {
                // Update the original user with the newly provided data
                if (firstName) {
                  originalUserData.firstName = firstName;
                }
                if (lastName) {
                  originalUserData.lastName = lastName;
                }
                if (password) {
                  originalUserData.password = helpers.hash(password);
                }
                _data.update(usersPath, email, originalUserData, function(err) {
                  if (!err) {
                    callback(constants.HTTP_STATUS_OK);
                  } else {
                    callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                      {'Error' : 
                        `users.put: An error occurred while trying to update the user ${email}. ${err}`});
                  }
                });
              } else {
                callback(constants.HTTP_BAD_REQUEST, 
                  {'Error' : 
                    `users.put: An error occurred while trying to read the user ${email}. ${err}`});
              }
            });
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'users.put: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'users.put: Missing authentication token'});
      }
    } else {
      callback(constants.HTTP_BAD_REQUEST, 
        {'Error' : 
          'users:put: At least the email address and one or more fields to update' + 
          ' should be provided'});
    }
  });
};

module.exports = userService;