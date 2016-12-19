import {IntentDialog, IDialogResult, Session, Prompts, LuisRecognizer, EntityRecognizer, IEntity, UniversalBot} from "botbuilder";
import {ILuisRecognizerResult} from "../../../momondo-ai";
import {Booking, Origin, Destination} from "./booking";
import {PlaceFactory} from "./place-factory";
import {registerPlacePrompt} from "./prompts/place-prompt";

function searchTickets(session: Session, booking: Booking)
{
    session.send("ticketSearch",
        `${booking.origin.name} (${booking.origin.iata})`,
        `${booking.destination.name} (${booking.destination.iata})`,
        booking.departureDate.toISOString());

    session.sendTyping();

    setTimeout(() => { session.send("No tickets found.") }, 2000);

    session.endDialog();
}

export function registerBookFlightDialog(intents: IntentDialog, bot: UniversalBot): void
{
    registerPlacePrompt(bot);

    intents.matches("BookFlight", [
        async (session: Session, result: ILuisRecognizerResult, next): Promise<void> => {
            let originEntity = EntityRecognizer.findEntity(result.entities, "Origin");
            let destinationEntity = EntityRecognizer.findEntity(result.entities, "Destination");
            let departureDateEntity = EntityRecognizer.findEntity(result.entities, "DepartureDate");
            let tripTypeEntity = EntityRecognizer.findEntity(result.entities, "TripType");

            let booking: Booking = session.dialogData.booking = 
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

            if(result.intents[0].actions[0].triggered)
            {
                searchTickets(session, booking);
            }

            if(!booking.destination.isValid())
            {
                session.beginDialog("/promptDestination", 
                {
                    prompt: "destinationPrompt",
                    retryPrompt: "destinationRetryPrompt",
                    maxRetries: Number.MAX_VALUE
                });
            }
            else
            {
                next();
            }
        },
        (session: Session, result: IDialogResult<Destination>, next): void => {
            let booking: Booking = session.dialogData.booking = Booking.deserialize(session.dialogData.booking);

            if(result.response)
            {
                booking.destination = Destination.deserialize(result.response);
            }

            if(!booking.departureDate) 
            {
                Prompts.time(session, "departureDatePrompt");
            }
            else
            {
                next(); 
            }
        },
        (session: Session, result: IDialogResult<IEntity>, next): void => {
            let booking: Booking = session.dialogData.booking = Booking.deserialize(session.dialogData.booking);

            if(result.response)
            {
                booking.departureDate = EntityRecognizer.resolveTime([result.response]);
            }

            if(!booking.origin.isValid())
            {
                session.beginDialog("/promptOrigin", 
                { 
                    prompt: "originPrompt",
                    retryPrompt: "originRetryPrompt",
                    maxRetries: Number.MAX_VALUE
                });
            }
            else
            {
                next();
            }
        },
        (session: Session, result: IDialogResult<Origin>, next): void => {
            let booking: Booking = session.dialogData.booking = Booking.deserialize(session.dialogData.booking);

            if(result.response)
            {
                booking.origin = Origin.deserialize(result.response);
            }

            searchTickets(session, booking);
        }
    ]);
}
