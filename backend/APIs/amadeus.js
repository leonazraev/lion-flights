const Amadeus = require('amadeus')
const amadeusAPI = new Amadeus({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
})

module.exports = amadeusAPI;