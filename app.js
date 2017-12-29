var express = require('express');

app = express();

var facebookPageAccessToken = "EAACBTvGK7nEBAJTBimku72u0kU6aJv06mLgzvLgrgJdVZB5jfXf9SxrmUpEeE65NzpWikHxADjlT8ZC9ZCshZAnNmA7bJyZBIA8OcCSjKCvLeZCqv2d3bR86gwQ4HOnKS64ZCnaj0AefnaMWSx4KtUnGe18gOIC6lWCiF4uplioagZDZD";
var facebookWebhookValidationToken = "manning_personal_bot7";
var dialogflowToken = "03f012e4c833404481e52d52075dbaa7"; 

app.set('port', process.env.PORT || 5000);

app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' && 
    req.query['hub.verify_token'] === facebookWebhookValidationToken) {
      console.log("Validating webhook");
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.error("Failed validation.");
      res.sendStatus(403);
    }
  });

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/webhook/', function (req, res){
    var messaging_events = req.body.entry[0].messaging;
    messaging_events.forEach(function(event){
      var senderID = event.sender.id;
      if (event.message && event.message.text) {
        var text = event.message.text;
        sendTextMessage(senderID, "Hello World!");
        sendMessageToDF(senderID, text);
        saveMessages(senderID, text);
      }
    });

    res.sendStatus(200);
  });


  var request = require('request');

function sendTextMessage(sender, text) {
  var messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token:facebookPageAccessToken
      },
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
};

var dialogflow = require('apiai');
var dialogflowApp = dialogflow(dialogflowToken);
function sendMessageToDF(sender, text) {
    var options = {
        sessionId: sender
      }
    var request = dialogflowApp.textRequest(text, options);
    request.on('response', function(response) {
        console.log(response.result);
    });
    request.on('error', function(error) {
        console.log(error);
      });
    request.end();
};

//mongoDB connection, creating schema & function to save messages
var databaseURI = "mongodb://heroku_p9v7193w:3sfdjuqtb0rcu78irh3thki781@ds241895.mlab.com:41895/heroku_p9v7193w";
var mongoDB = require('mongoose');
mongoDB.connect(databaseURI);
var Schema = mongoDB.Schema;
var messageDB = mongoDB.model('MessageDB', new Schema({
    senderId    : String,
    message    	: String,
    timestamp 	: String
}));

function saveMessages(senderId, message){
    var receivedMessage = new messageDB(
        {senderId:senderId, message: message,timestamp: new Date()});
    receivedMessage.save(function (err,savedMessage) {
      if (err) console.error(err);
    });
};

var google = require('googleapis');
var googleAuth = require('google-auth-library');    
const gAuth = new googleAuth();
var privateKey = require("./personal-bot-private-key.json");

function authorizeGoogle() {
    var gJwtClient = new gAuth.JWT(
        privateKey.client_email, 
        null,
        privateKey.private_key, 
        ['https://www.googleapis.com/auth/calendar']
    );
    gJwtClient.authorize(function (err, tokens) {
        if (err) {
          console.log(err);
          return;
        } else { 
            console.log("Authorization Successful!");
        }
        });
};
authorizeGoogle();
