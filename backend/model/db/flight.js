const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flightSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    depart: {
        departure: {
            iataCode: {type: String},
            terminal: {type: String},
            fullDateTime: {type: String},
            time: {type: String},
            airportName: {type: String}
        },
        arrival: {
            iataCode: {type: String},
            terminal: {type: String},
            fullDateTime: {type: String},
            time: {type: String},
            airportName: {type: String}
        },
        aircraft: {
            code: {type: String},
            aircraftName: {type: String}
        },
        carrierCode: {type: String},
        carrierName: {type: String},
        duration: {type: String},
        imgURL: {type: String}
    },
    return: {
        departure: {
            iataCode: {type: String},
            terminal: {type: String},
            fullDateTime: {type: String},
            time: {type: String},
            airportName: {type: String}
        },
        arrival: {
            iataCode: {type: String},
            terminal: {type: String},
            fullDateTime: {type: String},
            time: {type: String},
            airportName: {type: String}
        },
        aircraft: {
            code: {type: String},
            aircraftName: {type: String}
        },
        carrierCode: {type: String},
        carrierName: {type: String},
        duration: {type: String},
        imgURL: {type: String}
    },
    price: {
        total: {type: String},
        totalTaxes: {type: String},
        currency: {type: String},
        symbol: {type: String}
    },
    pricePerAdult: {
        total: {type: String},
        totalTaxes: {type: String},

    },
    departCity: {
        type: String
    },
    returnCity: {
        type: String
    }
})
module.exports = mongoose.model('Flight' , flightSchema);