/*
 *  Client library to work with Stripe for payments
 *
 */
'use strict';

// Dependencies
const https = require('https');
const querystring = require('querystring');
const config = require('./config');
const helpers = require('./helpers');
const constants = require('./constants');

const stripe = {};

stripe.performPayment = function (orderId, amount, description, token, callback) {

    const payload = {
        amount: amount,
        currency: 'usd',
        source: `${token}`,
        description: `${description}`,
        metadata: { orderId: `${orderId}`}
    };

    const stringPayload = querystring.stringify(payload);

    const requestDetails = {
        'protocol': 'https:',
        'hostname': 'api.stripe.com',
        'method': 'post',
        'path': '/v1/charges',
        'auth': config.stripe.user,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload),
            'Authorization': 
            'Basic ' + new Buffer(config.stripe.user + 
                ':', 'utf8').toString('base64')
        }
    };

    const req = https.request(requestDetails, function (res) {
        // Grab the status of the send request
        const status = res.statusCode;
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
            // save all the data from response
        });

        res.on('end', function () {
            if (status === constants.HTTP_STATUS_OK || status === constants.HTTP_STATUS_CREATED) {
                const stripeResponsePayload = helpers.parseJsonToObject(responseString);
                callback(false, stripeResponsePayload);
            } else {
                callback('Status code returned was ' + status);
            }
        });
    });

    //Bind to the err event so it doesn't get thrown
    req.on('error', function (e) {
        callback(e);
    });

    req.write(stringPayload);

    req.end();
};

module.exports = stripe;