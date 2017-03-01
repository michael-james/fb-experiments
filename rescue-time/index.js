
var graph = require('fbgraph');
var request = require('request');
var moment = require('moment');

var express   = require('express');
var app = express(); 
var server = require("http").createServer(app);

////////////////////////////
// variables
////////////////////////////

// rescue time access key
var rescue_key = "B63PhXJ7xm7UNiMF2pVP7DsNENVThc8rzDQ67QoU";

// facebook access token
var access_token = "EAACEdEose0cBAPTI0Uet3G8iVS5yNVxCiuccKmC0uHjvuLiW3tpWYqRPVFtSqI62KMLdTEEbFlz6y3v4lVB011Khy1kaicv7EiIe1hVN0oeGn5z99F5bQ3ofhCkifKkkPwc15rgYg5gNz55iXsYdLiz5xHGGO8ANxVWFiLZBL55UmTZAl8XC2djSzeMVEZD";

////////////////////////////
// get rescue time data
////////////////////////////

console.log("Requesting Rescue Time data...");

request('https://www.rescuetime.com/anapi/daily_summary_feed?key=' + rescue_key, function(err, resp, body){
	
	console.log("Processing Rescue Time data...");

	var json = JSON.parse(body);

	var week = 7;
	var total = 0;
	var msg = "";

	for (var i = 0; i < week; i++) {
		var d = week - i - 1;
		total += json[d].total_hours;
		var day = moment(json[d].date).format("ddd, MMM D");
		msg += day + ": " + json[d].total_duration_formatted;
		msg += (d == 0) ? "" : "\n";
	}

	var totalHours = Math.floor(total);
	var totalHrWord = (totalHours == 1) ? "hour" : "hours";
	var totalMinutes = Math.ceil((total - totalHours) * 60);
	var totalMinWord = (totalMinutes == 1) ? "minute" : "minutes";

	var totalMsg = totalHours + " " + totalHrWord + " and " + totalMinutes + " " + totalMinWord;

	var toPost = "I spent " + totalMsg + " on my laptop and smartphone in the past 7 days:\n" + msg;

	post(toPost);

	// for (var day in json) {
	// 	console.log(json[day].date + ": " + json[day].total_duration_formatted);
	// }

});

////////////////////////////
// post to Facebook
////////////////////////////

function auth() {
	app.get('/auth', function(req, res) {
	  // we don't have a code yet 
	  // so we'll redirect to the oauth dialog 
	  if (!req.query.code) {
	    console.log("Performing oauth for some user right now.");
	  
	    var authUrl = graph.getOauthUrl({
	        "client_id":     conf.client_id
	      , "redirect_uri":  conf.redirect_uri
	      , "scope":         conf.scope
	    });
	 
	    if (!req.query.error) { //checks whether a user denied the app facebook login/permissions 
	      res.redirect(authUrl);
	    } else {  //req.query.error == 'access_denied' 
	      res.send('access denied');
	    }
	  }
	  // If this branch executes user is already being redirected back with  
	  // code (whatever that is) 
	  else {
	    console.log("Oauth successful, the code (whatever it is) is: ", req.query.code);
	    // code is set 
	    // we'll send that and get the access token 
	    graph.authorize({
	        "client_id":      conf.client_id
	      , "redirect_uri":   conf.redirect_uri
	      , "client_secret":  conf.client_secret
	      , "code":           req.query.code
	    }, function (err, facebookRes) {
	      res.redirect('/UserHasLoggedIn');
	    });
	  }
	});
}

function post(msg) {
	graph.setAccessToken(access_token);
	graph.setVersion("2.8");

	var wallPost = {
	  message: msg
	};

	console.log("Posting to Facebook...");
	 
	graph.post("/feed", wallPost, function(err, res) {
	  // returns the post id 
	  console.log(res); // { id: xxxxx} 
	  console.log("You posted the following message to Facebook:");
	  console.log(msg);
	});
}

