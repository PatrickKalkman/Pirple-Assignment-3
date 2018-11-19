/* Order service
 * Define the REST endpoint for /orders
 * The service manages orders 
 */
'use strict';

// Dependencies
const routes = require('./routes');
const constants = require('./constants');
const _data = require('./data');
const helpers = require('./helpers');
const tokenService = require('./tokenService');
const shoppingCardService = require('./shoppingCartService');
const stripe = require('./stripe');
const mailgun = require('./mailgun');

const ordersPath = 'orders';
const orderIdLength = 20;

const orderService = {};

orderService.init = function() {

  // Create a new order for the user from a shopping cart.
  routes.add(ordersPath, constants.HTTP_METHOD_POST, function(data, callback) {
    const email = typeof (data.payload.email) === 'string' && 
      data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    const shoppingCardId = typeof (data.payload.shoppingCartId) === 'string' && 
      data.payload.shoppingCartId.trim().length === shoppingCardService.getIdLength() ? 
        data.payload.shoppingCartId.trim() : false;
    const paymentToken = typeof (data.payload.token) === 'string' && 
      data.payload.token.trim().length > 0 ? data.payload.token.trim() : false;
    
    if (email && shoppingCardId && paymentToken) {
      // Get the token from the header
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      if (token) {
        tokenService.verifyToken(token, email, function(tokenIsValid) {
          if (tokenIsValid) {
            //Read the shopping card
            shoppingCardService.getShoppingCart(shoppingCardId, function(err, shoppingCart) {
              if (!err) {
                shoppingCardService.calculateTotal(shoppingCardId, function(err, totalAmount) {
                  if (!err) {
                    const orderId = helpers.generateId(orderIdLength);
                    const description = `Your order with id ${orderId}`;
                    // Perform the payment using Stripe.com
                    stripe.performPayment(orderId, totalAmount, description, paymentToken, function(err, stripeData) {
                      if (!err && stripeData.paid) {
                        const orderData = {
                          id : orderId,
                          shoppingCartId: shoppingCardId,
                          status : 'paid',
                          stripeId: stripeData.id
                        };

                        // The payment succeeded, save the order and mail the user that the order is fullfilled.
                        _data.create(ordersPath, orderId, orderData, function(err) {
                          if (!err) {
                            let description = `The following will be delivered for $${totalAmount/100} \n`;
                            description += JSON.stringify(shoppingCart);
                            // Send the receipt to the user 
                            mailgun.sendMail(email, `Order ${orderId} receipt`, description, function(err) {
                              if (!err) {
                                callback(constants.HTTP_STATUS_OK);
                              } else {
                                callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                                  {'Error': `orders.post: Could not send receipt via email. ${err}`});
                              }
                            });
                          } else {
                            callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                              {'Error' : `orders.post: An error occurred while saving the order. ${err}`});                              
                          }
                        });
                      } else {
                        callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                          {'Error' : `orders.post: An error occurred while creating the payment. ${err}`});  
                      }
                    });
                  } else {
                    callback(constants.HTTP_INTERNAL_SERVER_ERROR, 
                      {'Error' : `orders.post: The total of the shopping card could not be calculated. ${err}`});    
                  }
                });
              } else {
                callback(constants.HTTP_BAD_REQUEST, 
                  {'Error' : `orders.post: The shopping cart could not be found. ${err}`});
              }
            });
          } else {
            callback(constants.HTTP_STATUS_UNAUTHORIZED, {'Error' : 'orders.post: The given token is invalid'});
          }
        });
      } else {
        callback(constants.HTTP_STATUS_UNAUTHORIZED, {'Error' : 'orders.post: Missing authentication token'});
      }
    } else {
      callback(constants.HTTP_BAD_REQUEST, {'Error' : 'orders:post: not all required fields are available'});
    }
  });
};

module.exports = orderService;