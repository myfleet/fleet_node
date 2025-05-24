// const express = require('express');
// const { registerUser, signInUser } = require('../controllers/userController');

// const router = express.Router();

// // User Routes
// router.post('/register', registerUser);
// router.post('/login', signInUser);



// module.exports = router;
const express = require('express');
const {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  loginUser,
  forgotPassword,
  resetPassword
} = require('../controllers/userController');

const router = express.Router();

// Registration with OTP flow
router.post('/send-otp', sendRegistrationOtp);
router.post('/verify-register', verifyOtpAndRegister);

// Login
router.post('/login', loginUser);

// Password reset flow
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;