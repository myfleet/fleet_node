


const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Register User
const registerUser = async (req, res) => {
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

  try {
    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const result = await pool.query(
      `INSERT INTO myFleetregistration (name, email, mobile, dob, companyName, gstNumber, address, pincode, state, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, email, mobile, dob, companyName, gstNumber, address, pincode, state, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error registering user:", error);

    if (error.code === '23505') {
      res.status(400).json({ error: "Email already exists." });
    } else {
      res.status(500).json({ error: "Internal server error." });
    }
  }
};

// Placeholder for sign-in logic (to be implemented)
const signInUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const result = await pool.query(
      `SELECT * FROM myFleetregistration WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials."
      });
    }

    const user = result.rows[0];

    // Compare provided password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials."
      });
    }

    // Return response for authenticated user
    res.status(200).json({
      authenticated: true,
      email: user.email,
      name: user.name,
      companyName: user.companyname,
      mobile: user.mobile,
    });
  } catch (error) {
    console.error("Error signing in user:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { registerUser, signInUser };
