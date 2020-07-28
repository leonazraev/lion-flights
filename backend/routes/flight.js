const exspress = require('express');
const router = exspress.Router();
const flightController = require('../controllers/flight');
const protectRouteAuth = require('../middleware/is-auth');

router.get('/flights',flightController.getFlights);
router.post('/add-flight',protectRouteAuth,flightController.postAddFlight);
router.delete('/delete-flight',protectRouteAuth,flightController.postDeleteFlight);
router.post('/flights',flightController.postFlights);
router.post('/flights-offers',flightController.postFlightOffers);
router.get('/cities',flightController.getCities);

module.exports = router;
