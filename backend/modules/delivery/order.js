/*
 * TSB - order.js
 * 
 * handles all condom ordering aspects
 *
 */



var mongoose = require('mongoose');
var crypto = require('crypto');
var order = require('./models').orders;
var user = require('../user/models').users;
var shortid = require('shortid');

exports.request = function (session_token, dorm_name, dorm_room, delivery_type, date_requested, callback) {
    var dn = dorm_name;
    var dr = dorm_room;
    var dt = delivery_type;
    var drt = date_requested;

    var now = new Date();
    var oid = shortid.generate();

    var device_uuid;
    //get the user's device_uuid
    user.find ({session_token : session_token}, function(err, users) {
	if (users.length == 0) {
	    callback({'response': 'DELIVERY_REQUEST_ERROR_USER_NOT_FOUND'}, 400);
	} else {
	    device_uuid = users[0].device_uuid;
	    
	        //debug
	    console.log("request got in at:", new Date());
	    console.log('request was made by uuid: ' + device_uuid);

	    order.find({order_number:oid}, function (err, orders) {
		var len = orders.length;
		if (len == 0) {
		    var new_order = new order({
			order_number : oid, 

			requester : device_uuid, 
			deliverer : "",
			
			order_received : true, 
			order_accepted : false,
			order_delivered : false,
			order_failed : false,
			
			date_requested: now, 
			date_accepted : null, 
			date_delivered: null, 

			delivery_estimate : -1,

			delivery_destination : {
			    dorm_name : dorm_name, 
			    dorm_room : dorm_room, 
			    delivery_type : delivery_type, 
			    coordinates : {
				lat: 0, 
				lng: 0,
			    }
			}
			
		    });

		    //order doesn't exist, so let's create it
		    new_order.save(function (err) {
			if (err) {
			    console.log('Error saving new order: ' + err);
			}
			callback({'response': "DELIVERY_REQUEST_SUCCESS",
				  'order_number': oid}, 
			 	 201);
		    });
		} else {
		    callback({'response':"DELIVERY_REQUEST_ERROR_DATABASE_ERROR"}, 500);
		}

	    });

	}
    });	
    


    
}


exports.status = function(order_number, callback) {

    var oid = order_number;

    order.find({order_number:oid}, function (err, orders) {
	var len = orders.length;


	if (len == 0) {
	    // the order doesn't exist
	    callback({'response':'DELIVERY_STATUS_ERROR_ORDER_NOT_FOUND'},
	    		   400);
	} else {
	    var or = orders[0];
	    var order_accepted = or.order_accepted;
	    var order_delivered = or.order_delivered;
	    var order_failed = or.order_failed;
	    
	    var date_accepted = or.date_accepted;
	    var date_delivered = or.date_delivered;
	    var delivery_estimate = or.delivery_estimate;

	    callback({
		'response' : 'DELIVERY_STATUS_SUCCESS',
		'order_number' : oid,
		
		'order_accepted' : order_accepted,
		'order_delivered' : order_delivered,
		'order_failed' : order_failed,
		
		'date_accepted' : date_accepted,
		'date_delivered' : date_delivered,
		
		'delivery_estimate' : delivery_estimate,
		
		}, 
		200);
	}


    });

}

	    
	    
