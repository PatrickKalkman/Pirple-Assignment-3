/* Menu service
 * Define the REST endpoint for /Menu
 * The service manages the menu items of 
 */
'use strict';

// Dependencies
const routes = require('./routes');
const constants = require('./constants');
const _data = require('./data');
const tokenService = require('./tokenService');

const menuPath = 'menu';
const menuFile = 'menu';

const menuService = {};

menuService.menuItems = [];

menuService.init = function() {
  
  // Read the menu items from menu.json which is a json file retrieved from 
  // https://github.com/RIAEvangelist/node-dominos-pizza-api/tree/master/sampleResp
  // which originates from the dominos pizza API
  _data.read(menuPath, menuFile, function(err, data) {
    if (!err && data) {
      // Filter and select only the properties that we want to keep
      for (const item in data.Variants) {
        const sizeCode = data.Variants[item].SizeCode;
        // There are a lot of items in the domino.json, by filtering on size 10 and 12
        // we limit the list to only pizza's
        if (sizeCode === '10' || sizeCode === '12') {
          const menuItem = {};
          menuItem.code = data.Variants[item].Code;
          menuItem.name = data.Variants[item].Name;
          menuItem.price = data.Variants[item].Price;
          menuService.menuItems.push(menuItem);
        }
      }
    } else {
      console.log(`An error occurred while trying to read the menu items. ${err}`);      
    }
  });

  // Read the available menu items 
  routes.add(menuPath, constants.HTTP_METHOD_GET, function (data, callback) {
    const email = typeof (data.queryStringObject.email) === 'string' && 
      data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            // The menu items are read during startup .
            callback(constants.HTTP_STATUS_OK, menuService.menuItems);
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, 
              {'Error' : 'menu.get: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, 
          {'Error' : 'menu.get: Missing authentication token'});
      }
    } else {
        callback(constants.HTTP_BAD_REQUEST, 
          {'Error' : 'menu.get: Missing required field, email.'});
    }
  });
};

menuService.isValidMenuItemCode = function(menuItemCode) {
  const menuItem = menuService.menuItems.find(item => item.code === menuItemCode);
  return menuItem !== undefined;
};

menuService.getItemPrice = function(menuItemCode) {
  const menuItem = menuService.menuItems.find(item => item.code === menuItemCode);
  return menuItem.price;
};

module.exports = menuService;