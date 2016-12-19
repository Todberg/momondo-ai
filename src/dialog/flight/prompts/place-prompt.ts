import {IDialogResult, PromptType, UniversalBot} from "botbuilder";
import {validatedPromptAsync} from "../../../infrastructure/validated-prompt-async";
import {PlaceFactory} from "../place-factory";

export function registerPlacePrompt(bot: UniversalBot): void
{
    bot.dialog("/promptOrigin", validatedPromptAsync(PromptType.text, async (args: IDialogResult<any>): Promise<boolean> =>
    {
        let origin = await PlaceFactory.createOrigin(args.response);
        args.response = origin;

        return Promise.resolve(origin.isValid());
    }));

    bot.dialog("/promptDestination", validatedPromptAsync(PromptType.text, async (args: IDialogResult<any>): Promise<boolean> =>
    {
        let destination = await PlaceFactory.createDestination(args.response);
        args.response = destination;

        return Promise.resolve(destination.isValid());
    }));
}
