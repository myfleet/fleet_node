const express = require('express');
const { vehicalMaster, driverMaster } = require('../controllers/allMasterController');


const masterRouter = express.Router();

// User Routes
masterRouter.post('/vehical_master', vehicalMaster);
masterRouter.post('/driver_master', driverMaster);




module.exports =  masterRouter;
