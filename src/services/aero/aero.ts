export interface IAeroAirports
{
    code: string;
    name: string;
    city: string;
    country: string;
}

export interface IAeroResponse
{
    airports: IAeroAirports[];
}
