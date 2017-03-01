/**
 * Module dependencies.
 */
 
var express   = require('express')
  , graph     = require('fbgraph');
var app = express(); 
var server = require("http").createServer(app);
var request = require('request');
var moment = require('moment');

////////////////////////////
// variables
////////////////////////////

// rescue time access key
var rescue_key = "B63PhXJ7xm7UNiMF2pVP7DsNENVThc8rzDQ67QoU";

var access_token = "";

////////////////////////////
// set-up server to authenticate
////////////////////////////

// this should really be in a config file! 
var conf = {
    client_id:      '256298324817787'
  , client_secret:  '065ad391e0b590f541c795885bf928d9'
  , scope:          'email, user_about_me, user_birthday, user_location, publish_actions'
  // You have to set http://localhost:3000/ as your website 
  // using Settings -> Add platform -> Website 
  , redirect_uri:   'http://localhost:3000/auth'
};
 
// Configuration 
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
 
// Routes 
 
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
      console.log("access denied");
    }
  }
  // If this branch executes user is already being redirected back with  
  // code (whatever that is) 
  else {
    // console.log("Oauth successful, the code (whatever it is) is: ", req.query.code);
    console.log("Oauth successful!");
    // code is set 
    // we'll send that and get the access token 
    graph.authorize({
        "client_id":      conf.client_id
      , "redirect_uri":   conf.redirect_uri
      , "client_secret":  conf.client_secret
      , "code":           req.query.code
    }, function (err, facebookRes) {
      access_token = facebookRes.access_token;
      requestTime();
    });
  }
});
 
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Express server listening on port %d", port);
});

////////////////////////////
// get rescue time data
////////////////////////////

function requestTime() {
  console.log("Requesting Rescue Time data...");

  request('https://www.rescuetime.com/anapi/daily_summary_feed?key=' + rescue_key, function(err, resp, body){
    
    console.log("Processing Rescue Time data...");

    var json = JSON.parse(body);

    var week = 7;
    var total = 0;
    var msg = "";

    for (var i = 0; i < week; i++) {
      total += json[i].total_hours;
      var day = moment(json[i].date).format("ddd, MMM D");
      msg += day + ": " + json[i].total_duration_formatted;
      msg += (i == week - 1) ? "" : "\n";
    }

    var totalHours = Math.floor(total);
    var totalHrWord = (totalHours == 1) ? "hr" : "hrs";
    var totalMinutes = Math.ceil((total - totalHours) * 60);
    var totalMinWord = (totalMinutes == 1) ? "min" : "mins";

    var totalMsg = totalHours + " " + totalHrWord + " and " + totalMinutes + " " + totalMinWord;

    var toPost = "I spent " + totalMsg + " on my laptop/smartphone in the past 7 days:\n" + msg + "\n\nYou can track your time using http://rescuetime.com";

    post(toPost);

    // for (var day in json) {
    //  console.log(json[day].date + ": " + json[day].total_duration_formatted);
    // }

  });
}

////////////////////////////
// post to Facebook
////////////////////////////

function post(msg) {
  graph.setAccessToken(access_token);
  graph.setVersion("2.8");

  var wallPost = {
    message: msg
  };

  console.log("Posting to Facebook...");
   
  graph.post("/feed", wallPost, function(err, res) {
    // returns the post id
    console.log("Posting feedback...");
    console.log(res); // { id: xxxxx} 
    console.log("You posted the following message to Facebook:");
    console.log(msg);

    process.exit();
  });
}