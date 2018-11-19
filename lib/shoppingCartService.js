/* Shopping cart service
 * Define the REST endpoint for /ShoppingCart
 * The service manages the menuitems which are stored in a shopping cart 
 */
'use strict';

// Dependencies
const routes = require('./routes');
const constants = require('./constants');
const _data = require('./data');
const helpers = require('./helpers');
const tokenService = require('./tokenService');
const menuService = require('./menuService');

const shoppingCartPath = 'shoppingcarts';
const shoppingCardIdLength = 20;

const shoppingCartService = {};

shoppingCartService.getIdLength = function() {
  return shoppingCardIdLength;
};

shoppingCartService.init = function() {

  // Read a shopping cart with the given id 
  routes.add(shoppingCartPath, constants.HTTP_METHOD_GET, function (data, callback) {
    const email = typeof (data.queryStringObject.email) === 'string' && 
      data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    const shoppingCartId = typeof (data.queryStringObject.id) === 'string' && 
      data.queryStringObject.id.trim().length === shoppingCardIdLength ? 
        data.queryStringObject.id : false;
    if (email && shoppingCartId) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.read(shoppingCartPath, shoppingCartId, function(err, data) {
              if (!err && data) {
                callback(constants.HTTP_STATUS_OK, data);
              } else {
                callback(constants.HTTP_STATUS_NOT_FOUND);
              }
            });
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'shoppingcarts.get: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'shoppingcarts.get: Missing authentication token'});
      }
    } else {
        callback(constants.HTTP_BAD_REQUEST, 
          {'Error' : 'shoppingcarts.get: Missing required field, email.'});
    }
  });

  // Create a new shopping cart for the user.
  routes.add(shoppingCartPath, constants.HTTP_METHOD_POST, function(data, callback) {
    const email = typeof (data.payload.email) === 'string' && 
      data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    
    if (email) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            const shoppingCartId = helpers.generateId(shoppingCardIdLength);
            const shoppingCart = {};
            shoppingCart.id = shoppingCartId;
            shoppingCart.email = email;
            shoppingCart.status = 'new';
            shoppingCart.items = [];
            
            if (data.payload.items && data.payload.items.length > 0) {
              data.payload.items.forEach(function(item) {
                // Check to see if menu item Code is valid
                if (item.code && item.amount > 0 && menuService.isValidMenuItemCode(item.code)) {
                  const cartItem = {};
                  cartItem.code = item.code;
                  cartItem.amount = item.amount;
                  shoppingCart.items.push(cartItem);
                } else {
                  console.log(`item not added to card, item with code ${item.code} was not valid or amount was 0`);
                }
              });
            }

            _data.create(shoppingCartPath, shoppingCartId, shoppingCart, function(err) {
              if (!err) {
                callback(constants.HTTP_STATUS_OK, shoppingCart);
              } else {
                callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                  {'Error' : `shoppingcarts.post: Could not create the shopping cart. ${err}`});
              }
            });
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'shoppingcarts.post: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'shoppingcarts.post: Missing authentication token'});
      }
    } else {
      callback(constants.HTTP_BAD_REQUEST, 
        {'Error' : 
          'shoppingcarts:post: At least the email address and one or more fields to update' + 
          ' should be provided'});
    }
  });

   // Update an existing shopping cart for the user.
   routes.add(shoppingCartPath, constants.HTTP_METHOD_PUT, function(data, callback) {
    const email = typeof (data.payload.email) === 'string' && 
      data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    const shoppingCartId = typeof (data.payload.id) === 'string' && 
    data.payload.id.trim().length === shoppingCardIdLength ? 
      data.payload.id.trim() : false;
    
    if (email && shoppingCartId) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.read(shoppingCartPath, shoppingCartId, function(err, shoppingCartData) {
              if (!err && shoppingCartData) {
                // Clear the items from the shopping cart and add the menu items
                shoppingCartData.items = [];
                if (data.payload.items && data.payload.items.length > 0) {
                  data.payload.items.forEach(function(item) {
                    // Check to see if menu item Code is valid
                    if (item.code && item.amount > 0 && menuService.isValidMenuItemCode(item.code)) {
                      const cartItem = {};
                      cartItem.code = item.code;
                      cartItem.amount = item.amount;
                      shoppingCartData.items.push(cartItem);
                    } else {
                      console.log(`item not added to card, item with code ${item.code} was not valid or amount was 0`);
                    }
                  });
                  _data.update(shoppingCartPath, shoppingCartId, shoppingCartData, function(err) {
                    if (!err) {
                      callback(constants.HTTP_STATUS_OK, shoppingCartData);
                    } else {
                      callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                        {'Error' : `shoppingcarts.put: Could not update the shopping cart. ${err}`});
                    }
                  });
                }
              } else {
                callback(constants.HTTP_BAD_REQUEST, 
                  {'Error' : `shoppingcarts.put: Could not read the shopping cart with id ${shoppingCartId}. ${err}`});
              }
            });


          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'shoppingcarts.put: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'shoppingcarts.put: Missing authentication token'});
      }
    } else {
      callback(constants.HTTP_BAD_REQUEST, 
        {'Error' : 
          'shoppingcarts:put: At least the email address and one or more fields to update' + 
          ' should be provided'});
    }
  });

  // Read a shopping cart with the given id 
  routes.add(shoppingCartPath, constants.HTTP_METHOD_DELETE, function (data, callback) {
    const email = typeof (data.queryStringObject.email) === 'string' && 
      data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    const shoppingCartId = typeof (data.queryStringObject.id) === 'string' && 
      data.queryStringObject.id.trim().length === shoppingCardIdLength ? 
        data.queryStringObject.id : false;
    if (email && shoppingCartId) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.delete(shoppingCartPath, shoppingCartId, function(err) {
              if (!err) {
                callback(constants.HTTP_STATUS_OK);
              } else {
                callback(constants.HTTP_BAD_REQUEST, 
                  {'Error' : 'An error ocurred while trying to delete the ' +
                   `shopping cart with id ${shoppingCartId}. ${err}`});
              }
            });
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'shoppingcarts.delete: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'shoppingcarts.delete: Missing authentication token'});
      }
    } else {
        callback(constants.HTTP_BAD_REQUEST, 
          {'Error' : 'shoppingcarts.delete: Missing required field, email.'});
    }
  });
};

shoppingCartService.getShoppingCart = function(shoppingCartId, callback) {
  _data.read(shoppingCartPath, shoppingCartId, function(err, data) {
    if (!err && data) {
      callback(false, data);
    } else {
      callback(true, {'Error' : `An error ocurred while trying to read the shoppingcard. ${err}`});
    }
  });
};

shoppingCartService.calculateTotal =  function(shoppingCartId, callback) {
  shoppingCartService.getShoppingCart(shoppingCartId, function(err, shoppingCart) {
    if (!err) {
      let totalAmount = 0;
      shoppingCart.items.forEach(function(item) {
        if (menuService.isValidMenuItemCode(item.code)) {
          const price = menuService.getItemPrice(item.code);
          totalAmount += item.amount * price;
        } else {
          callback(true);
        }
      });
      // Multiply the amount times 100 because stripe accepts the charge amount in cents.
      callback(false, totalAmount * 100);
    } else {
      callback(true);
    }
  }); 
};

module.exports = shoppingCartService;