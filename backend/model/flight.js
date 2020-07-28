module.exports = class FlightDetails {
    constructor(){
        this.depart = {
            departure: {
                iataCode: '',
                terminal: '',
                fullDateTime: '',
                time: '',
                airportName: ''
            },
            arrival: {
                iataCode: '',
                terminal: '',
                fullDateTime: '',
                time: '',
                airportName: ''
            },
            aircraft: {
                code: '',
                aircraftName: ''
            },
            carrierCode: '',
            carrierName: '',
            duration: '',
            imgURL: ''
        };
        this.return = {
            departure: {
                iataCode: '',
                terminal: '',
                fullDateTime: '',
                time: '',
                airportName: ''
            },
            arrival: {
                iataCode: '',
                terminal: '',
                fullDateTime: '',
                time: '',
                airportName: ''
            },
            aircraft: {
                code: '',
                aircraftName: ''
            },
            carrierCode: '',
            carrierName: '',
            duration: '',
            imgURL: ''
        };
        this.price = {
            total: '',
            totalTaxes: '',
            currency: '',
            symbol: ''
        };
        this.pricePerAdult = {
            total: '',
            totalTaxes: '',

        }
    }
}