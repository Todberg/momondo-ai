import { EntityRecognizer, IEntity } from "botbuilder";
import { ILuisRecognizerResult } from "../luis";

export class PlaceFactory
{
    public static createDestination(name: string): Destination;
    public static createDestination(result: ILuisRecognizerResult): Destination;

    public static createDestination(args): Destination
    {
        let locationName: string = null;

        if(typeof args === "string")
        {
            return new Destination(args);
        }

        let locationEntity: IEntity = EntityRecognizer.findEntity(args.entities, "Destination");

        if(locationEntity !== null)
        {
            return new Destination(locationEntity.entity);
        }

        return new Destination();
    }

    public static createOrigin(name: string): Origin;
    public static createOrigin(result: ILuisRecognizerResult): Origin;

    public static createOrigin(args): Origin
    {
        let locationName: string = null;

        if(typeof args === "string")
        {
            return new Destination(args);
        }

        let locationEntity: IEntity = EntityRecognizer.findEntity(args.entities, "Origin");

        if(locationEntity !== null)
        {
            return new Destination(locationEntity.entity);
        }

        return new Destination();
    }
}

export class Destination
{
    public constructor(name: string = null)
    {
        this.name = name;
    }

    public isValid(): boolean
    {
        return this.name !== null;
    }

    public readonly name: string;
}

export class Origin
{
    public constructor(name: string = null)
    {
        this.name = name;
    }

    public isValid(): boolean
    {
        return this.name !== null;
    }

    public readonly name: string;
}
