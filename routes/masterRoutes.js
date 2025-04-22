const express = require('express');
const { vehicalMaster, driverMaster, createTrip } = require('../controllers/allMasterController');


const masterRouter = express.Router();

// User Routes
masterRouter.post('/vehical_master', vehicalMaster);
masterRouter.post('/driver_master', driverMaster);
masterRouter.post('/trip_master', createTrip);




module.exports =  masterRouter;
