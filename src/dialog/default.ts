import {IntentDialog} from "botbuilder";

export function registerDefaultDialog(intents: IntentDialog): void
{
    intents.onDefault(session => {
        session.send("default", session.message.text);
    });
}
