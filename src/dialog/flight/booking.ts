export class Booking
{
    public origin: Origin;
    public destination: Destination;
    public departureDate: Date;

    public static deserialize(json: Booking): Booking
    {
        let booking = new Booking();
        booking.origin = Origin.deserialize(json.origin);
        booking.destination = Destination.deserialize(json.destination);
        booking.departureDate = json.departureDate ? new Date(json.departureDate) : null;

        return booking;
    }
}

export class Origin
{
    public isValid(): boolean
    {
        return this.name !== null;
    }

    public name: string = null;
    public iata: string = null;

    public static deserialize(json: Object): Origin
    {
        let origin = new Origin();
        Object.assign(origin, json);
        
        return origin;
    }
}

export class Destination
{
    public isValid(): boolean
    {
        return this.name !== null;
    }

    public name: string = null;
    public iata: string = null;

    public static deserialize(json: Object): Destination
    {
        let destination = new Destination();
        Object.assign(destination, json);
        
        return destination;
    }
}
