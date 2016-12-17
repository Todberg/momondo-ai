import {config} from "dotenv";
import {Server, createServer} from "restify";
import {json} from "web-request";
import 
{
    IntentDialog, IDialogResult, DialogAction, Session, Prompts,
    LuisRecognizer, EntityRecognizer, LuisDialog, RecognizeMode, IIntent, IEntity,
    ChatConnector, UniversalBot,
    IIntentRecognizerResult
} from "botbuilder";
import {ILuisRecognizerResult} from "./luis";
import {IBooking} from "./booking";

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

function completeBooking(session: Session, booking: IBooking)
{
    let originPromise = json(`https://airport.api.aero/airport/match/${booking.origin}?user_key=${process.env.SITA_DEVELOPER_AERO_AIRPORT_API_KEY}`);
    let destinationPromise = json(`https://airport.api.aero/airport/match/${booking.destination}?user_key=${process.env.SITA_DEVELOPER_AERO_AIRPORT_API_KEY}`);

    Promise.all([originPromise, destinationPromise])
        .then(([origin, destination]: [any, any]) =>
        {
            session.send("origin %s, destination %s, departure %s",
                origin.airports[0].code,
                destination.airports[0].code,
                booking.departureDate);
        });
}

intents.matches("BookFlight", [
    (session: Session, result: ILuisRecognizerResult, next): void => {
        let originEntity = EntityRecognizer.findEntity(result.entities, "Origin");
        let destinationEntity = EntityRecognizer.findEntity(result.entities, "Destination");
        let departureDateEntity = EntityRecognizer.findEntity(result.entities, "DepartureDate");
        let tripTypeEntity = EntityRecognizer.findEntity(result.entities, "TripType");

        let booking: IBooking = session.dialogData.booking = 
        {
            origin: originEntity 
                ? originEntity.entity
                : null,
            destination: destinationEntity
                ? destinationEntity.entity
                : null,
            departureDate: departureDateEntity 
                ? EntityRecognizer.resolveTime(result.entities.filter(e => e.entity === departureDateEntity.entity))
                : null,
            tripType: tripTypeEntity
                ? tripTypeEntity.entity
                : null
        }

        if(result.intents[0].actions[0].triggered)
        {
           completeBooking(session, booking);
        }

        if(!booking.destination)
        {
            Prompts.text(session, "Where would you like to go?");
        }
        else
        {
            next();
        }
    },
    (session: Session, result: IDialogResult<string>, next): void => {
        let booking: IBooking = session.dialogData.booking;
        
        if(result.response)
        {
            booking.destination = result.response;
        }

        if(!booking.departureDate) 
        {
            Prompts.time(session, "When would you like to depart?");
        }
        else
        {
            next(); 
        }
    },
    (session: Session, result: IDialogResult<IEntity>, next): void => {
        let booking: IBooking = session.dialogData.booking;

        if(result.response)
        {
            booking.departureDate = EntityRecognizer.resolveTime([result.response]);
        }

        if(!booking.origin)
        {
            Prompts.text(session, "From where would you be travelling from?");
        }
        else
        {
            next();
        }
    },
    (session: Session, result: IDialogResult<string>, next): void => {
        let booking: IBooking = session.dialogData.booking;

        if(result.response)
        {
            booking.origin = result.response;
        }

        completeBooking(session, booking);
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
