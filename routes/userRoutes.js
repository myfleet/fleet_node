const express = require('express');
const { registerUser, signInUser } = require('../controllers/userController');

const router = express.Router();

// User Routes
router.post('/register', registerUser);
router.post('/login', signInUser);



module.exports = router;
