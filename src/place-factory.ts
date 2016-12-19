import { EntityRecognizer, IEntity } from "botbuilder";
import {json} from "web-request";
import {ILuisRecognizerResult} from "../luis";
import {IAeroResponse} from "../aero";

export class PlaceFactory
{
    public static async createOrigin(name: string): Promise<Origin>;
    public static async createOrigin(result: ILuisRecognizerResult): Promise<Origin>;

    public static async createOrigin(args): Promise<Origin>
    {
        let airportName: string;

        if(typeof args === "string")
        {
            airportName = args;
        }
        else
        {
            let locationEntity: IEntity = EntityRecognizer.findEntity(args.entities, "Origin");
            if(locationEntity !== null)
            {
                airportName = locationEntity.entity;
            }
        }

        let origin = new Origin();

        try
        {
            let response = await json<IAeroResponse>(`https://airport.api.aero/airport/match/${airportName}?user_key=${process.env.SITA_DEVELOPER_AERO_AIRPORT_API_KEY}`);
            origin.name = response.airports.length === 1 ? response.airports[0].name : null;
        }
        catch(error)
        {
            console.log("ERROR ORIGIN");
        }

        return origin;
    }

    public static async createDestination(name: string): Promise<Destination>;
    public static async createDestination(result: ILuisRecognizerResult): Promise<Destination>;

    public static async createDestination(args): Promise<Destination>
    {
        let airportName: string;

        if(typeof args === "string")
        {
            airportName = args;
        }
        else
        {
            let locationEntity: IEntity = EntityRecognizer.findEntity(args.entities, "Destination");
            if(locationEntity !== null)
            {
                airportName = locationEntity.entity;
            }
        }

        let destination = new Destination();

        try
        {
            let response = await json<IAeroResponse>(`https://airport.api.aero/airport/match/${airportName}?user_key=${process.env.SITA_DEVELOPER_AERO_AIRPORT_API_KEY}`);
            destination.name = response.airports.length === 1 ? response.airports[0].name : null;
        }
        catch(error)
        {
            console.log("ERROR DESTINATION");
        }

        return destination;
    }
}

export class Origin
{
    public isValid(): boolean
    {
        return this.name !== null;
    }

    public name: string;
}

export class Destination
{
    public isValid(): boolean
    {
        return this.name !== null;
    }

    public name: string;
}
