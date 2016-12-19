import {Origin, Destination} from "./src/place-factory";

export interface IBooking
{
    origin: Origin;
    destination: Destination;
    departureDate: Date;
}
