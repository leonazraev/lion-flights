const fs = require('fs');
const path = require('path');
const amadeus = require('../APIs/amadeus');
const Flight = require('../model/db/flight');
const User = require('../model/db/user');

var crg = require('country-reverse-geocoding').country_reverse_geocoding();
var lookup = require('country-data').lookup;
const FlightDetails = require('../model/flight')
exports.postAddFlight = async (req, res, next) => {
    const flight = req.body.flight;
    const departCity = req.body.departCity;
    const returnCity = req.body.returnCity;
    const user_id = req.userId;
    try {
        let flightDB = await Flight.findOne({ depart: flight.depart, return: flight.return, userId: user_id });
        if (flightDB) {
            const error = new Error('This flight already exist in your flights page')
            error.statusCode = 403;
            throw error;
        }
        flightDB = await new Flight({ depart: flight.depart, return: flight.return, userId: user_id, price: flight.price, pricePerAdult: flight.pricePerAdult, departCity, returnCity });
        if (!flightDB) {
            const error = new Error('Some problem with the server');
            error.statusCode = 500;
            throw error;
        }
        const user = await User.findOne({ _id: user_id })
        await user.myFlights.push(flightDB);
        await user.save();
        await flightDB.save();

        res.status(201).json({ message: 'flight added to your db' })

    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        errorsHandler(err, next)
    }

}
exports.postDeleteFlight = async (req, res, next) => {
    const flight = req.body.flight;
    const userId = req.userId;
    const flightId = flight._id;
    try {
        let user = await User.findOne({ _id: userId });
        let indexOfDeletedFlight = await user.myFlights.indexOf(flightId);
        await user.myFlights.splice(indexOfDeletedFlight, 1);
        await user.save();
        await Flight.findOneAndDelete({ _id: flightId });
        res.status(204).json({
            message: 'Flight deleted!'
        })



    }
    catch (err) {
        errorsHandler(err, next);
    }


}
exports.getFlights = async (req, res, next) => {
    try {
        const userFlights = await User.find({ userId: req.userId }).populate('myFlights');
        if (userFlights.length === 0) {
            const error = new Error('user not found');
            error.statusCode = 404;
            throw error;
        }
        const flights = userFlights[0].myFlights;
        const parsedFlights = JSON.parse(JSON.stringify(flights));
        res.status(200).json({ message: 'successful fetched user flights', data: parsedFlights })
    }
    catch (err) {
        errorsHandler(err, next)
    }

}
exports.postFlights = (req, res, next) => {
    let from = req.body.from;
    let to = req.body.to;
    let depart = req.body.depart;
    let returns = req.body.return;
    let passengers = req.body.passengers;
    let departCity = req.body.departCity;
    let returnCity = req.body.returnCity;

    if (!from || !to || !depart || !returns || !passengers) {
        error = new Error('Validation faild!')
        error.statusCode = 422;
        errorsHandler(error, next);
    }

    let flightsArray = [];
    let flightData = {};

    let cityCodeFrom = from.substr(from.indexOf('(') + 1, from.length - 1)
    let cityCodeTo = to.substr(to.indexOf('(') + 1, to.length - 1)

    cityCodeFrom = cityCodeFrom.slice(0, cityCodeFrom.length - 1);
    cityCodeTo = cityCodeTo.slice(0, cityCodeTo.length - 1);

    flightData.cityCodeTo = cityCodeTo;
    flightData.cityCodeFrom = cityCodeFrom;
    flightData.depart = depart;
    flightData.returns = returns;
    flightData.passengers = passengers;
    flightData.nonflight = true;
    flightData.departCity = departCity;
    flightData.returnCity = returnCity;



    fetchDirectFlightsFromAmadeusAPI(flightData, res, next);
    //fetchFlightsFromLocalJson(res, flightData);
}
exports.postFlightOffers = (req, res, next) => {
    //one number after the point
    const long = Math.round(req.body.longitude * 10) / 10;
    const lat = Math.round(req.body.latitude * 10) / 10;

    //country name
    var countryName = crg.get_country(lat, long).name;

    let countryCode = lookup.countries({ name: countryName })[0].alpha2
    const filteredAirPorts = fetchAirPortCodeByCountry(countryCode);
    //res.json({data: 'test'})
    fetchFlightsOffersFromAmadeusAPI(filteredAirPorts, res, next);
    //fetchFlightsOffersFromJson(filteredAirPorts, res);


}
fetchFlightsOffersFromAmadeusAPI = async (filteredAirPorts, res, next) => {
    let flightsOffers = [];
    let index = 0;
    const dates = randomDates();
    try {

        const result1 = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: filteredAirPorts[0].iata,
            destinationLocationCode: 'MAD',
            departureDate: dates[0].fullDepartureDate,
            returnDate: dates[0].fullReturnDate,
            adults: 1,
            max: 1,
            nonStop: true
        })

        if (!result1) {
            const error = new Error('Some problem with the server');
            error.statusCode = 500;
            error.data = { departCity: filteredAirPorts[0].city, flightsOffers };

            throw error;
        }
        flightsOffers = await flightsOffers.concat(fetchFlightDetails(JSON.parse(result1.body)));
        flightsOffers[0].returnCity = 'Madrid';

        const result2 = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: filteredAirPorts[0].iata,
            destinationLocationCode: 'AMS',
            departureDate: dates[1].fullDepartureDate,
            returnDate: dates[1].fullReturnDate,
            adults: 1,
            max: 1,
            nonStop: true
        })

        if (!result2) {
            const error = new Error('Some problem with the server');
            error.statusCode = 500;
            error.data = { departCity: filteredAirPorts[0].city, flightsOffers };
            throw error;
        }
        flightsOffers = await flightsOffers.concat(fetchFlightDetails(JSON.parse(result2.body)));
        flightsOffers[1].returnCity = 'Amsterdam';

        const result3 = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: filteredAirPorts[0].iata,
            destinationLocationCode: 'CDG',
            departureDate: dates[2].fullDepartureDate,
            returnDate: dates[2].fullReturnDate,
            adults: 1,
            max: 1,
            nonStop: true
        })

        if (!result3) {
            const error = new Error('Some problem with the server');
            error.statusCode = 500;
            error.data = { departCity: filteredAirPorts[0].city, flightsOffers };
            throw error;
        }
        flightsOffers = await flightsOffers.concat(fetchFlightDetails(JSON.parse(result3.body)));
        flightsOffers[2].returnCity = 'Paris';
        fs.writeFile(path.join('backend','util','flightsOffers.json'), JSON.stringify(flightsOffers), err => {

        })
        res.json({ message: 'Flights successfully fetched!', data: { departCity: filteredAirPorts[0].city, flightsOffers } })
    }
    catch (err) {

        errorsHandler(err, next)
    }



}
fetchFlightsOffersFromJson = async (filteredAirPorts, res) => {
    let data = fs.readFileSync(path.join('backend','util', 'flightsOffers.json'));
    
    dataArr = JSON.parse(data);
    dataArr.forEach(e => {
        
        e.pricePerAdult.total = 1;
       
    })

    res.json({ message: 'Flights successfully fetched!', data: { departCity: filteredAirPorts[0].city, flightsOffers: dataArr } })
}
fetchAirPortCodeByCountry = (countryCode) => {

    let data = fs.readFileSync(path.join('backend','util','airports3.json'));
    dataArr = JSON.parse(data);
    let filteredAirports = [];
    
    for (i in dataArr) {
        if (dataArr[i].country === countryCode && dataArr[i].iata !== '') {
            filteredAirports.push(dataArr[i])
        }
    }
    return filteredAirports;
}
randomDates = () => {
    const now = new Date();

    const dates = [];
    let currentYear = now.getFullYear();
    let currentMounth = now.getMonth();

    for (let i = 0; i < 6; i++) {
        let departYear = currentYear;
        let returnYear = currentYear;
        let randomDuration = Math.floor(Math.random() * 9) + 6;

        let departureDay = Math.floor(Math.random() * 28) % 27 === 0 ? 1 : Math.floor(Math.random() * 28);
        let returnDay = departureDay + randomDuration;

        let departureMounth = Math.floor(Math.random() * 8) + 1 + currentMounth;

        if (departureMounth > 12) {
            departureMounth %= 12
            departYear = currentYear + 1;
            returnYear = departYear;
        }
        else {
            departYear = currentYear;
        }
        let returnMounth;
        if (returnDay > 29) {
            returnDay %= 29 + 1;
            returnMounth = departureMounth + 1;
        }
        else returnMounth = departureMounth
        if (returnMounth > 12) {
            returnMounth %= 12;
            returnYear = departYear + 1
        }
        let fullDepartureDate = departYear + '-' + departureMounth + '-' + departureDay;
        let fullReturnDate = returnYear + '-' + returnMounth + '-' + returnDay;
        let fullDepartureDateArr = fullDepartureDate.split('-');
        let fullReturnDateArr = fullReturnDate.split('-');

        if (fullDepartureDateArr[1].length === 1) {
            if (fullDepartureDateArr[1] === '0')
                fullDepartureDateArr[1] = '1'
            fullDepartureDateArr[1] = '0' + fullDepartureDateArr[1]
        }
        if (fullDepartureDateArr[2].length === 1) {
            if (fullDepartureDateArr[2] === '0')
                fullDepartureDateArr[2] = '1'
            fullDepartureDateArr[2] = '0' + fullDepartureDateArr[2]
        }

        if (fullReturnDateArr[1].length === 1) {
            if (fullReturnDateArr[1] === '0')
                fullReturnDateArr[1] = '1'
            fullReturnDateArr[1] = '0' + fullReturnDateArr[1]
        }
        if (fullReturnDateArr[2].length === 1) {
            if (fullReturnDateArr[2] === '0')
                fullReturnDateArr[2] = '1'
            fullReturnDateArr[2] = '0' + fullReturnDateArr[2]
        }

        fullDepartureDate = fullDepartureDateArr.join('-')
        fullReturnDate = fullReturnDateArr.join('-');
        dates.push({ fullDepartureDate, fullReturnDate })
    }
    return dates;
}
exports.getCities = (req, res, next) => {

    let rawdata = fs.readFileSync(path.join('backend','util', 'airports.json'));
    let cities = [];
    rawDataArr = JSON.parse(rawdata);

    for (let i in rawDataArr) {
        if (rawDataArr[i].iata !== '' && rawDataArr[i].city !== '' && rawDataArr[i] !== undefined) {

            cities.push({
                name: rawDataArr[i].city,
                code: rawDataArr[i].iata,
                countryCode: rawDataArr[i].country
            })
        }
    }
    return res.status(200).json(JSON.stringify(cities))
}
errorsHandler = (error, next) => {
    if (!error.statusCode)
        error.statusCode = 500;
    next(error);
}
fetchDirectFlightsFromAmadeusAPI = async (flightData, res, next) => {

    try {
        const flightOffersSearch = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: flightData.cityCodeFrom,
            destinationLocationCode: flightData.cityCodeTo,
            departureDate: flightData.depart,
            returnDate: flightData.returns,
            adults: flightData.passengers,
            max: 6,
            nonStop: flightData.nonflight

        });
        if (!flightOffersSearch) {
            error = new Error('The server is not ready to handle the request.')
            error.statusCode = 503;
            throw error;
        }

        const parsedData = await fetchFlightDetails(JSON.parse(flightOffersSearch.body));
        parsedData.forEach(e => {
            e.pricePerAdult.total = flightData.passengers;
        })
        if (!parsedData) {
            error = new Error('Some problem to fetch the data')
            error.statusCode = 500;
            throw error;
        }

        await res.status(200).json({ message: 'Flights successfully fetched!', data: { flights: parsedData, departCity: flightData.departCity, returnCity: flightData.returnCity } });
    }
    catch (err) {

        errorsHandler(err, next)
    }





}
fetchFlightDetails = (rawDataArr) => {

    let flightsArray = [];


    rawDataArr["data"].forEach(element => {

        let flightDetails = new FlightDetails();
        //from

        flightDetails.depart.departure.iataCode = element["itineraries"][0]["segments"][0]["departure"].iataCode;
        flightDetails.depart.departure.terminal = element["itineraries"][0]["segments"][0]["departure"].terminal;
        flightDetails.depart.departure.fullDateTime = element["itineraries"][0]["segments"][0]["departure"].at;
        flightDetails.depart.departure.time = flyightDateToHours(flightDetails.depart.departure.fullDateTime);
        //
        flightDetails.depart.arrival.iataCode = element["itineraries"][0]["segments"][0]["arrival"].iataCode;
        flightDetails.depart.arrival.terminal = element["itineraries"][0]["segments"][0]["arrival"].terminal;
        flightDetails.depart.arrival.fullDateTime = element["itineraries"][0]["segments"][0]["arrival"].at;
        flightDetails.depart.arrival.time = flyightDateToHours(flightDetails.depart.arrival.fullDateTime);
        //
        flightDetails.depart.carrierCode = element["itineraries"][0]["segments"][0].carrierCode;
        flightDetails.depart.duration = element["itineraries"][0]["segments"][0].duration;
        flightDetails.depart.aircraft.code = element["itineraries"][0]["segments"][0]["aircraft"]["code"];
        //to
        flightDetails.return.departure.iataCode = element["itineraries"][1]["segments"][0]["departure"].iataCode;
        flightDetails.return.departure.terminal = element["itineraries"][1]["segments"][0]["departure"].terminal;
        flightDetails.return.departure.fullDateTime = element["itineraries"][1]["segments"][0]["departure"].at;
        flightDetails.return.departure.time = flyightDateToHours(flightDetails.return.departure.fullDateTime);

        //
        flightDetails.return.arrival.iataCode = element["itineraries"][1]["segments"][0]["arrival"].iataCode;
        flightDetails.return.arrival.terminal = element["itineraries"][1]["segments"][0]["arrival"].terminal;
        flightDetails.return.arrival.fullDateTime = element["itineraries"][1]["segments"][0]["arrival"].at;
        flightDetails.return.arrival.time = flyightDateToHours(flightDetails.return.arrival.fullDateTime);

        //
        flightDetails.return.carrierCode = element["itineraries"][1]["segments"][0].carrierCode;
        flightDetails.return.duration = element["itineraries"][1]["segments"][0].duration;
        flightDetails.return.aircraft.code = element["itineraries"][1]["segments"][0]["aircraft"]["code"];

        //additional details
        flightDetails.depart.carrierName = rawDataArr["dictionaries"]["carriers"][flightDetails.depart.carrierCode];
        flightDetails.depart.aircraft.aircraftName = rawDataArr["dictionaries"]["aircraft"][flightDetails.depart.aircraft.code];
        flightDetails.return.carrierName = rawDataArr["dictionaries"]["carriers"][flightDetails.return.carrierCode];
        flightDetails.return.aircraft.aircraftName = rawDataArr["dictionaries"]["aircraft"][flightDetails.return.aircraft.code];


        flightDetails.depart.departure.airportName = rawDataArr["dictionaries"]["locations"][flightDetails.depart.departure.iataCode].detailedName;
        flightDetails.depart.arrival.airportName = rawDataArr["dictionaries"]["locations"][flightDetails.depart.arrival.iataCode].detailedName;
        flightDetails.return.departure.airportName = rawDataArr["dictionaries"]["locations"][flightDetails.return.departure.iataCode].detailedName;
        flightDetails.return.arrival.airportName = rawDataArr["dictionaries"]["locations"][flightDetails.return.arrival.iataCode].detailedName;

        //price
        flightDetails.price.total = element["price"].total;
        flightDetails.pricePerAdult.total = 1
        flightDetails.price.currency = Object.keys(rawDataArr["dictionaries"]["currencies"])[0];
        flightDetails = fetchFlagImg(flightDetails)
        flightDetails.price.symbol = fetchCurrencySymbol(flightDetails.price.currency);
        flightsArray.push(flightDetails)

    })
    return flightsArray;
}
fetchCurrencySymbol = (currency) => {
    let currencyRawData = fs.readFileSync(path.join('backend','util','currencySymbol.json'));
    currencyRawDataArr = JSON.parse(currencyRawData);
    return currencyRawDataArr[currency.toUpperCase()].symbol_native;
}
fetchFlagImg = (flightDetails) => {
    let flagsData = fs.readFileSync(path.join('backend','util', 'airlinesFlags.json'));
    flagsDataArr = JSON.parse(flagsData);

    flagsDataArr.forEach(element => {
        
        if ( element.name.toUpperCase().includes(flightDetails.depart.carrierName.toUpperCase())) {
            flightDetails.depart.imgURL = element.logo;
        }
        if (element.name.toUpperCase().includes(flightDetails.return.carrierName.toUpperCase())) {
            flightDetails.return.imgURL = element.logo;
        }
    })
    return flightDetails;
}
fetchFlightsFromLocalJson = (res, flightData) => {
    let data = fs.readFileSync(path.join('backend','util', 'multiFlights.json'));
    dataArr = JSON.parse(data);
    let flightsArray = fetchFlightDetails(dataArr);
    res.status(200).json({ message: 'Flights successfully fetched!', data: flightsArray, departCity: flightData.departCity, returnCity: flightData.returnCity });
}
flyightDateToHours = (date) => {
    if (date) {
        let tempDate = date.substr(date.indexOf('T') + 1);
        return tempDate.substr(0, 5);
    }
    else
        return '';
}