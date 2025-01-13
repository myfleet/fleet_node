



const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const pool = require('./config/db'); // Database configuration file

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Create Database Tables
const initializeTables = async () => {
  try {
   

    // myFleetregistration table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS myFleetregistration (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        mobile VARCHAR(15) NOT NULL,
        dob DATE NOT NULL,
        companyName VARCHAR(100) NOT NULL,
        gstNumber VARCHAR(15) NOT NULL,
        address TEXT NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        state VARCHAR(50) NOT NULL,
        password VARCHAR(100) NOT NULL
      );
    `);
    console.log('myFleetregistration table created or already exists.');
  } catch (err) {
    console.error('Error initializing tables:', err);
  }
};

// Ensure tables are initialized
initializeTables().catch(err => console.error('Failed to initialize tables:', err));

// API Routes
app.use('/api', userRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
