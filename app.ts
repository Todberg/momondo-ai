import {config} from "dotenv";
import {Server, createServer} from "restify";
import {IntentDialog, LuisRecognizer, RecognizeMode, ChatConnector, UniversalBot} from "botbuilder";
import {registerBookFlightDialog, registerHelpDialog, registerDefaultDialog} from "./src/dialog/index"

// Loads .env variables into process.env.
config();

let luisAPIHostName = process.env.MICROSOFT_LUIS_API_HOST_NAME || 'api.projectoxford.ai';
let luisAppId = process.env.LuisAppId || process.env.MICROSOFT_LUIS_APP_ID;
let luisAPIKey = process.env.LuisAPIKey || process.env.MICROSOFT_LUIS_API_KEY;

const LuisModelUrl = `https://${luisAPIHostName}/luis/v1/application?id=${luisAppId}&subscription-key=${luisAPIKey}`;

let recognizer = new LuisRecognizer(LuisModelUrl);
let intents = new IntentDialog({ recognizers: [recognizer], recognizeMode : RecognizeMode.onBegin });

/* Create ChatConnector */
let connector = new ChatConnector(
{
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

/* Create UniversalBot */
let bot = new UniversalBot(connector,
{
    localizerSettings:
    {
        defaultLocale: "en"
    }
});

bot.dialog('/', intents);

/* Register conversation */
registerBookFlightDialog(intents, bot);
registerHelpDialog(intents);
registerDefaultDialog(intents);

// Setup Restify Server
let server: Server = createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log("%s listening to %s", server.name, server.url);
});

server.post("/api/messages", connector.listen());
