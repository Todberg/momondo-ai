import {PromptType, Dialog, SimpleDialog, Session, IDialogResult, ResumeReason, IPromptArgs} from "botbuilder";

function prompt(session: Session, args: IDialogResult<any>, promptType: PromptType, isValid: boolean)
{
    let isCancelled: boolean = false;

    switch(args.resumed)
    {
        case ResumeReason.canceled:
        case ResumeReason.forward:
        case ResumeReason.back:
            isCancelled = true;
            break;
    }

    if(isValid || isCancelled)
    {
        session.endDialogWithResult(args);
    }
    else if(!session.dialogData.hasOwnProperty("prompt"))
    {
        session.dialogData = clone(args);
        session.dialogData.promptType = promptType;

        if(!session.dialogData.hasOwnProperty("maxRetries"))
        {
            session.dialogData.maxRetries = 2;
        }

        let promptArgs = clone(session.dialogData);
        promptArgs.maxRetries = 0;
        session.beginDialog("BotBuilder:Prompts", promptArgs);
    }
    else if(session.dialogData.maxRetries > 0)
    {
        session.dialogData.maxRetries--;
        let promptArgs = clone(session.dialogData);
        promptArgs.maxRetries = 0;
        promptArgs.prompt = session.dialogData.retryPrompt || `I didn't understand. ${session.dialogData.prompt}`;
        session.beginDialog("BotBuilder:Prompts", promptArgs);
    }
    else
    {
        session.endDialogWithResult({ resumed: ResumeReason.notCompleted });
    }
}

export function validatedPromptAsync(promptType: PromptType, validator: (response: any) => Promise<boolean>): Dialog
{
    return new SimpleDialog(async (session: Session, args: IDialogResult<any>): Promise<void> =>
    {
        args = args || {};

        let isValid = false;

        if(args.response)
        {
            try
            {
                isValid = await validator(args);
            }
            catch(error)
            {
                session.error(error);
            }
        }

        let isCancelled: boolean = false;

        switch(args.resumed)
        {
            case ResumeReason.canceled:
            case ResumeReason.forward:
            case ResumeReason.back:
                isCancelled = true;
                break;
        }

        if(isValid || isCancelled)
        {
            session.endDialogWithResult(args);
        }
        else if(!session.dialogData.hasOwnProperty("prompt"))
        {
            session.dialogData = clone(args);
            session.dialogData.promptType = promptType;

            if(!session.dialogData.hasOwnProperty("maxRetries"))
            {
                session.dialogData.maxRetries = 2;
            }

            let promptArgs: IPromptArgs = clone(session.dialogData);
            promptArgs.maxRetries = 0;
            session.beginDialog("BotBuilder:Prompts", promptArgs);
        }
        else if(session.dialogData.maxRetries > 0)
        {
            session.dialogData.maxRetries--;
            let promptArgs: IPromptArgs = clone(session.dialogData);
            promptArgs.maxRetries = 0;
            promptArgs.prompt = session.dialogData.retryPrompt || `I didn't understand. ${session.dialogData.prompt}`;
            session.beginDialog("BotBuilder:Prompts", promptArgs);
        }
        else
        {
            session.endDialogWithResult({ resumed: ResumeReason.notCompleted });
        }
    });
}

function clone(obj: any): any {
    var cpy: any = {};
    if (obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                cpy[key] = obj[key];
            }
        }
    }
    return cpy;
}
