"use strict";

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require("botbuilder");
var spellService = require('./spell-service');

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
 
var luisAPIHostName = process.env.LuisAPIHostName;
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;

const LuisModelUrl = `https://${luisAPIHostName}/luis/v1/application?id=${luisAppId}&subscription-key=${luisAPIKey}`;

var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer], recognizeMode : builder.RecognizeMode.onBegin })

intents.matches('BookFlight', [
    function (session, args, next) {
        
    }
]);

intents.matches('Help', builder.DialogAction.send('Hi! Try asking me things like ...'));

intents.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// Spell checking
if (process.env.IS_SPELL_CORRECTION_ENABLED == "true") {
    bot.use({
        botbuilder: function (session, next) {
            spellService
                .getCorrectedText(session.message.text)
                .then(text => {
                    session.message.text = text;
                    next();
                })
                .catch((error) => {
                    console.error(error);
                    next();
                });
        }
    })
}

bot.dialog('/', intents);

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());