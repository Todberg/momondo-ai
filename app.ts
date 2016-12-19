import {config} from "dotenv";
import {Server, createServer} from "restify";
import {json} from "web-request";
import 
{
    IntentDialog, IDialogResult, DialogAction, Session, Prompts, SimplePromptRecognizer, PromptType,
    LuisRecognizer, EntityRecognizer, LuisDialog, RecognizeMode, IIntent, IEntity,
    ChatConnector, UniversalBot,
    IIntentRecognizerResult
} from "botbuilder";
import {ILuisRecognizerResult} from "./luis";
import {validatedPromptAsync} from "./src/validated-prompt-async";
import {IAeroResponse} from "./aero";
import {IBooking} from "./booking";
import {PlaceFactory, Origin, Destination} from "./src/place-factory";

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
    session.send("booking done");
    
    session.endDialog();
}

let persistedBooking;

intents.matches("BookFlight", [
    async (session: Session, result: ILuisRecognizerResult, next): Promise<void> => {
        let originEntity = EntityRecognizer.findEntity(result.entities, "Origin");
        let destinationEntity = EntityRecognizer.findEntity(result.entities, "Destination");
        let departureDateEntity = EntityRecognizer.findEntity(result.entities, "DepartureDate");
        let tripTypeEntity = EntityRecognizer.findEntity(result.entities, "TripType");

        let booking: IBooking = session.dialogData.booking = 
        {
            origin: await PlaceFactory.createOrigin(result),
            destination: await PlaceFactory.createDestination(result),
            departureDate: departureDateEntity 
                ? EntityRecognizer.resolveTime(result.entities.filter(e => e.entity === departureDateEntity.entity))
                : null,
            tripType: tripTypeEntity
                ? tripTypeEntity.entity
                : null
        }

        persistedBooking = booking;

        console.log("booking.origin", JSON.stringify(booking.origin));
        console.log("booking.destination", JSON.stringify(booking.destination));

        console.log("booking.origin instanceof Origin", booking.origin instanceof Origin);
        console.log("booking.destination instanceof Destination", booking.destination instanceof Destination);

        if(result.intents[0].actions[0].triggered)
        {
           completeBooking(session, booking);
        }

        if(!booking.destination.isValid())
        {
            session.beginDialog("/promptDestination", 
            {
                prompt: "To where?",
                retryPrompt: "Try again",
                maxRetries: 100
            });
        }
        else
        {
            next();
        }
    },
    (session: Session, result: IDialogResult<Destination>, next): void => {
        let booking: IBooking = session.dialogData.booking;

        if(result.response)
        {
            booking.destination = result.response;
        }

        if(!booking.departureDate) 
        {
            Prompts.time(session, "When?");
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
        
        console.log("booking.origin instanceof Origin", booking.origin instanceof Origin);
        console.log("session.userData.booking.origin", session.userData.booking.origin instanceof Origin);
        console.log("persistedBooking", persistedBooking.origin instanceof Origin);

        if(!booking.origin.isValid())
        {
            session.beginDialog("/promptOrigin", 
            { 
                prompt: "From where?",
                retryPrompt: "Try again",
                maxRetries: 100
            });
        }
        else
        {
            next();
        }
    },
    (session: Session, result: IDialogResult<Origin>, next): void => {
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

/* Dialogs */
bot.dialog('/', intents);

bot.dialog("/promptOrigin", validatedPromptAsync(PromptType.text, async (args: IDialogResult<any>): Promise<boolean> =>
{
    let origin = await PlaceFactory.createOrigin(args.response);
    return Promise.resolve(origin.isValid());
}));

bot.dialog("/promptDestination", validatedPromptAsync(PromptType.text, async (args: IDialogResult<any>): Promise<boolean> =>
{
    let origin = await PlaceFactory.createDestination(args.response);
    return Promise.resolve(origin.isValid());
}));

// Setup Restify Server
let server: Server = createServer()
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log("%s listening to %s", server.name, server.url);
});
server.post("/api/messages", connector.listen());
