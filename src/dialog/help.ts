import {IntentDialog, DialogAction} from "botbuilder";

export function registerHelpDialog(intents: IntentDialog): void
{
    intents.matches('Help', DialogAction.send("help"));
}
