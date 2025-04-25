const express = require('express');
const { vehicalMaster, driverMaster, createTrip, getTripsByVehicleNumber, getAllTrips } = require('../controllers/allMasterController');


const masterRouter = express.Router();

// User Routes
masterRouter.post('/vehical_master', vehicalMaster);
masterRouter.post('/driver_master', driverMaster);
masterRouter.post('/trip_master', createTrip);
masterRouter.get('/mis_report', getAllTrips);
masterRouter.get('/vehicle_details', getTripsByVehicleNumber);





module.exports =  masterRouter;
