import {EntityRecognizer, IEntity} from "botbuilder";
import {json} from "web-request";
import {ILuisRecognizerResult} from "../../../momondo-ai";
import {Booking, Origin, Destination} from "./booking";
import {IAeroResponse} from "../../services/aero/aero";

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

        let response = await json<IAeroResponse>(`https://airport.api.aero/airport/match/${airportName}?user_key=${process.env.SITA_DEVELOPER_AERO_AIRPORT_API_KEY}`);

        if(response.airports.length === 1)
        {
            origin.name = response.airports[0].name;
            origin.iata = response.airports[0].code;
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

        let response = await json<IAeroResponse>(`https://airport.api.aero/airport/match/${airportName}?user_key=${process.env.SITA_DEVELOPER_AERO_AIRPORT_API_KEY}`);
        
        if(response.airports.length === 1)
        {
            destination.name = response.airports[0].name;
            destination.iata = response.airports[0].code;
        }

        return destination;
    }
}
