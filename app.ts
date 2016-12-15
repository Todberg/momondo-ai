import {config} from "dotenv";
import {Server, createServer} from "restify";
import {
    IntentDialog, DialogAction, Session, Prompts,
    LuisRecognizer, EntityRecognizer, RecognizeMode,
    ChatConnector, UniversalBot,
    IIntentRecognizerResult
} from "botbuilder";
import {ILuisRecognizerResult} from "./luis";
import {writeFile} from "fs";

// Loads .env variables into process.env.
config();

let luisAPIHostName = process.env.MICROSOFT_LUIS_API_HOST_NAME || 'api.projectoxford.ai';
let luisAppId = process.env.LuisAppId || process.env.MICROSOFT_LUIS_APP_ID;
let luisAPIKey = process.env.LuisAPIKey || process.env.MICROSOFT_LUIS_API_KEY;

const LuisModelUrl = `https://${luisAPIHostName}/luis/v1/application?id=${luisAppId}&subscription-key=${luisAPIKey}`;

let recognizer = new LuisRecognizer(LuisModelUrl);

// Create chat bot
let connector = new ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
let bot = new UniversalBot(connector);

let intents = new IntentDialog({ recognizers: [recognizer], recognizeMode : RecognizeMode.onBegin });

intents.matches("BookFlight", [
    (session: Session, result: ILuisRecognizerResult, next): void => {
        let originEntity = EntityRecognizer.findEntity(result.entities, 'Origin');
        let destinationEntity = EntityRecognizer.findEntity(result.entities, 'Destination');
        let departureDateEntity = EntityRecognizer.findEntity(result.entities, 'DepartureDate');

        session.dialogData = 
        {
            origin: originEntity ? originEntity.entity : null,
            destination: destinationEntity ? destinationEntity.entity : null,
            DepartureDate: departureDateEntity 
                ? EntityRecognizer.resolveTime(result.entities.filter(e => e.entity === departureDateEntity.entity))
                : null
        }

        if(result.intents[0].actions[0].triggered)
        {
            session.send("origin %s, destination %s, departure %s",
                session.dialogData.origin,
                session.dialogData.destination,
                session.dialogData.departureDate);
        }
        else
        {
            session.send("Booking requirements not met");
        }

        // Debugging
        //writeFile("response.json", JSON.stringify(result, null, 2));
    }
]);

intents.matches('Help', DialogAction.send("Try asking me things like ..."));

intents.onDefault(session => {
    session.send("Sorry, I did not understand \'%s\'. Try asking things like ...", session.message.text);
});

bot.dialog('/', intents);

// Setup Restify Server
let server: Server = createServer()
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log("%s listening to %s", server.name, server.url);
});
server.post("/api/messages", connector.listen());
