


// const pool = require('../config/db');
// const bcrypt = require('bcrypt');

// // Register User
// const registerUser = async (req, res) => {
//   const {
//     name,
//     email,
//     mobile,
//     dob,
//     companyName,
//     gstNumber,
//     address,
//     pincode,
//     state,
//     password,
//     confirmPassword,
//   } = req.body;

//   try {
//     // Validate password match
//     if (password !== confirmPassword) {
//       return res.status(400).json({ error: "Passwords do not match." });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Insert user into the database
//     const result = await pool.query(
//       `INSERT INTO myFleetregistration (name, email, mobile, dob, companyName, gstNumber, address, pincode, state, password)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
//       [name, email, mobile, dob, companyName, gstNumber, address, pincode, state, hashedPassword]
//     );

//     res.status(201).json({
//       message: "User registered successfully.",
//       user: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error registering user:", error);

//     if (error.code === '23505') {
//       res.status(400).json({ error: "Email already exists." });
//     } else {
//       res.status(500).json({ error: "Internal server error." });
//     }
//   }
// };

// // Placeholder for sign-in logic (to be implemented)
// const signInUser = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Check if user exists
//     const result = await pool.query(
//       `SELECT * FROM myFleetregistration WHERE email = $1`,
//       [email]
//     );

//     if (result.rows.length === 0) {
//       return res.status(401).json({
//         error: "Invalid credentials."
//       });
//     }

//     const user = result.rows[0];

//     // Compare provided password with stored hashed password
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       return res.status(401).json({
//         error: "Invalid credentials."
//       });
//     }

//     // Return response for authenticated user
//     res.status(200).json({
//       authenticated: true,
//       email: user.email,
//       name: user.name,
//       companyName: user.companyname,
//       mobile: user.mobile,
//     });
//   } catch (error) {
//     console.error("Error signing in user:", error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// };

// module.exports = { registerUser, signInUser };

const bcrypt = require("bcrypt");
const pool = require("../config/db");
const nodemailer = require("nodemailer");

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const pendingRegistrations = new Map();

// 1️⃣ Send OTP for Registration
const sendRegistrationOtp = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      dob,
      companyName,
      gstNumber,
      address,
      pincode,
      state,
      password,
      confirmPassword,
    } = req.body;

    // Validate all required fields
    if (!name || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check if email is already registered
    const userExists = await pool.query(
      "SELECT * FROM myFleetregistration WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store OTP in database
    await pool.query(
      `INSERT INTO otp_verifications (email, otp, expires_at, purpose) 
       VALUES ($1, $2, $3, 'registration')
       ON CONFLICT (email) DO UPDATE 
       SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, purpose = EXCLUDED.purpose`,
      [email, otp, expiresAt]
    );

    // Store user details temporarily
    pendingRegistrations.set(email, {
      name,
      email,
      mobile,
      dob,
      companyName,
      gstNumber,
      address,
      pincode,
      state,
      password,
    });

    // Send OTP email
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Your Registration OTP",
    //   text: `Your OTP for registration is: ${otp}. It expires in 5 minutes.`,
    // };
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Registration OTP",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #fef9c3; padding: 20px; border-radius: 8px; border: 1px solid #facc15; max-width: 500px; margin: auto;">
          <h2 style="color: #2563eb; text-align: center;">MyFleet</h2>
          <p style="font-size: 16px; color: #374151;">Hello,</p>
          <p style="font-size: 16px; color: #374151;">
            Your OTP for registration is:
          </p>
          <div style="font-size: 28px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #374151;">
            This OTP will expire in <strong>5 minutes</strong>. If you didn't request this, please ignore this email.
          </p>
          <p style="font-size: 14px; color: #374151;">Thank you,<br/>The MyFleet Team</p>
        </div>
      `
    };
    

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending registration OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2️⃣ Verify OTP and Complete Registration
const verifyOtpAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Verify OTP
    const otpRecord = await pool.query(
      "SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2 AND purpose = 'registration'",
      [email, otp]
    );

    if (otpRecord.rows.length === 0) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > new Date(otpRecord.rows[0].expires_at)) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Get registration data
    const userData = pendingRegistrations.get(email);
    if (!userData) {
      return res.status(400).json({ error: "Registration data not found" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO myFleetregistration (
        name, email, mobile, dob, companyName, 
        gstNumber, address, pincode, state, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, name, email, mobile, companyName`,
      [
        userData.name,
        userData.email,
        userData.mobile,
        userData.dob,
        userData.companyName,
        userData.gstNumber,
        userData.address,
        userData.pincode,
        userData.state,
        hashedPassword,
      ]
    );

    // Clean up
    await pool.query("DELETE FROM otp_verifications WHERE email = $1", [email]);
    pendingRegistrations.delete(email);

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 3️⃣ Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await pool.query(
      "SELECT * FROM myFleetregistration WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return user data (excluding password)
    const userData = user.rows[0];
    delete userData.password;

    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 4️⃣ Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await pool.query(
      "SELECT * FROM myFleetregistration WHERE email = $1",
      [email]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store OTP
    await pool.query(
      `INSERT INTO otp_verifications (email, otp, expires_at, purpose) 
       VALUES ($1, $2, $3, 'password_reset')
       ON CONFLICT (email) DO UPDATE 
       SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, purpose = EXCLUDED.purpose`,
      [email, otp, expiresAt]
    );

    // Send email
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Password Reset OTP",
    //   text: `Your OTP for password reset is: ${otp}. It expires in 5 minutes.`,
    // };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #fef9c3; padding: 20px; border-radius: 8px; border: 1px solid #facc15; max-width: 500px; margin: auto;">
          <h2 style="color: #2563eb; text-align: center;">MyFleet</h2>
          <p style="font-size: 16px; color: #374151;">Hello,</p>
          <p style="font-size: 16px; color: #374151;">
            Your OTP for password reset is:
          </p>
          <div style="font-size: 28px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #374151;">
            This OTP will expire in <strong>5 minutes</strong>. If you didn't request a password reset, please ignore this email.
          </p>
          <p style="font-size: 14px; color: #374151;">Thank you,<br/>The MyFleet Team</p>
        </div>
      `
    };
    

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 5️⃣ Reset Password with OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP and new password are required" });
    }

    // Verify OTP
    const otpRecord = await pool.query(
      "SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2 AND purpose = 'password_reset'",
      [email, otp]
    );

    if (otpRecord.rows.length === 0) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > new Date(otpRecord.rows[0].expires_at)) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE myFleetregistration SET password = $1 WHERE email = $2",
      [hashedPassword, email]
    );

    // Clean up OTP
    await pool.query("DELETE FROM otp_verifications WHERE email = $1", [email]);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  loginUser,
  forgotPassword,
  resetPassword,
};