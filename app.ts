import {config} from "dotenv";
import {Server, createServer} from "restify";
import {IntentDialog, LuisRecognizer, EntityRecognizer, RecognizeMode, ChatConnector, UniversalBot, DialogAction} from "botbuilder";

// Loads .env variables into process.env.
config();

let luisAPIHostName = process.env.MICROSOFT_LUIS_API_HOST_NAME || 'api.projectoxford.ai';
let luisAppId = process.env.LuisAppId || process.env.MICROSOFT_LUIS_APP_ID;
let luisAPIKey = process.env.LuisAPIKey || process.env.MICROSOFT_LUIS_API_KEY;

const LuisModelUrl = `https://${luisAPIHostName}/luis/v1/application?id=${luisAppId}&subscription-key=${luisAPIKey}`;

let recognizer = new LuisRecognizer(LuisModelUrl);

let intents = new IntentDialog({ recognizers: [recognizer], recognizeMode : RecognizeMode.onBegin });

console.log("luisAPIHostName", luisAPIHostName);
console.log("luisAppId", luisAppId);
console.log("luisAPIKey", luisAPIKey);

intents.matches("BookFlight", [
    (session, args, next) => {
        let originEntity = EntityRecognizer.findEntity(args.entities, 'Origin');
        let destinationEntity = EntityRecognizer.findEntity(args.entities, 'Destination');
        let departureDateEntity = EntityRecognizer.findEntity(args.entities, 'DepartureDate');

        session.send("So you want to book a flight");
    }
]);

intents.matches('Help', DialogAction.send("Try asking me things like ..."));

intents.onDefault(session => {
    session.send("Sorry, I did not understand \'%s\'. Try asking things like ...", session.message.text);
});

// Create chat bot
let connector = new ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
let bot = new UniversalBot(connector);

bot.dialog('/', intents);

// Setup Restify Server
let server: Server = createServer()
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log("%s listening to %s", server.name, server.url);
});
server.post("/api/messages", connector.listen());
