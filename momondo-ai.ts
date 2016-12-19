export type LuisIntent = "BookFlight"|"None"|"Help";

export interface ILuisAction
{
    triggered: boolean;
    name: LuisIntent;
    parameters: ILuisActionParameter[];
}

export interface ILuisActionParameter
{
    name: string;
    required: boolean;
    value: ILuisEntity[];
}

export interface ILuisIntent
{
    intent: string;
    score: number;
    actions: ILuisAction[];
}

export interface ILuisEntity
{
    entity: string;
    type: string;
    score: number;
    startIndex: number | undefined;
    endIndex: number | undefined;
}

export interface ILuisRecognizerResult
{
    score: number;
    intent: LuisIntent;
    intents: ILuisIntent[];
    entities: ILuisEntity[];
}
