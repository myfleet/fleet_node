
const pool = require('../config/db'); 

const vehicalMaster = async (req, res) => {
    try {
        const {
            vehicleNumber,
            vehicleModel,
            rcNumber,
            pollutionDetails,
            chassisNumber,
            engineNumber,
            vehicleColor,
            ownerName,
        } = req.body;

        // Validate required fields
        if (!vehicleNumber || !vehicleModel || !rcNumber) {
            return res.status(400).json({ message: "Vehicle number, model, and RC number are required." });
        }

        // Check if vehicle number is already registered
        const checkQuery = `SELECT id FROM vehicalMaster WHERE vehicleNumber = $1`;
        const checkResult = await pool.query(checkQuery, [vehicleNumber]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "Vehicle number already registered." });
        }

        // Insert data into the vehicalMaster table
        const insertQuery = `
            INSERT INTO vehicalMaster (
                vehicleNumber, vehicleModel, rcNumber, pollutionDetails, 
                chassisNumber, engineNumber, vehicleColor, ownerName
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
        `;

        const insertValues = [
            vehicleNumber,
            vehicleModel,
            rcNumber,
            pollutionDetails,
            chassisNumber,
            engineNumber,
            vehicleColor,
            ownerName,
        ];

        const insertResult = await pool.query(insertQuery, insertValues);

        res.status(201).json({
            message: "Vehicle details saved successfully.",
            vehicleId: insertResult.rows[0].id, // Return the new vehicle's ID
        });
    } catch (error) {
        console.error("Error saving vehicle details:", error);
        res.status(500).json({ message: "Failed to save vehicle details." });
    }
};

const driverMaster = async (req, res) => {
    try {
        const {
            driverName,
            licenseNumber,
            contactNumber,
            adharNumber,
            dateOfBirth,
            bloodGroup,
            experience,
            
        } = req.body;

        // Validate required fields
        if (!licenseNumber || !contactNumber || !adharNumber) {
            return res.status(400).json({ message: "licence number, contact number, and adhar number are required." });
        }

        // Check if vehicle number is already registered
        const checkQuery = `SELECT id FROM driverMaster WHERE licenseNumber = $1`;
        const checkResult = await pool.query(checkQuery, [licenseNumber]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: "license Number already registered." });
        }

        // Insert data into the vehicalMaster table
        const insertQuery = `
            INSERT INTO driverMaster (
                driverName,  licenseNumber,  contactNumber, adharNumber, 
                dateOfBirth, bloodGroup,  experience
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `;

        const insertValues = [
            driverName,
            licenseNumber,
            contactNumber,
            adharNumber,
            dateOfBirth,
            bloodGroup,
            experience,
        ];

        const insertResult = await pool.query(insertQuery, insertValues);

        res.status(201).json({
            message: "driver details saved successfully.",
            vehicleId: insertResult.rows[0].id, // Return the new vehicle's ID
        });
    } catch (error) {
        console.error("Error saving vehicle details:", error);
        res.status(500).json({ message: "Failed to save driver details." });
    }
};

const createTrip = async (req, res) => {
  const {
    // Trip Info
    trip_date,
    trip_type,
    from_location,
    to_location,
    distance_km,
    estimated_duration,
    
    // Vehicle Details
    vehicle_type,
    vehicle_number,
    driver_name,
    driver_contact,
    capacity,
    
    // Payment & Pricing
    base_price,
    distance_charges = 0,
    additional_charges = 0,
    advance_payment = 0,
    payment_mode = 'cash',
    payment_status = 'unpaid',
    
    // Customer Details
    customer_name,
    phone_number,
    email,
    booking_source,
    
    // Other Fields
    trip_status = 'planned',
    trip_notes,
    created_by
  } = req.body;

  // Basic validation
  if (!trip_date || !from_location || !to_location || !vehicle_type || !vehicle_number || 
      !driver_name || !driver_contact || !base_price || !customer_name || !phone_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const query = `
      INSERT INTO trip_master (
        trip_date, trip_type, from_location, to_location, distance_km, estimated_duration,
        vehicle_type, vehicle_number, driver_name, driver_contact, capacity,
        base_price, distance_charges, additional_charges, advance_payment, payment_mode, payment_status,
        customer_name, phone_number, email, booking_source,
        trip_status, trip_notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *;
    `;

    const values = [
      trip_date,
      trip_type,
      from_location,
      to_location,
      distance_km,
      estimated_duration,
      vehicle_type,
      vehicle_number,
      driver_name,
      driver_contact,
      capacity,
      base_price,
      distance_charges,
      additional_charges,
      advance_payment,
      payment_mode,
      payment_status,
      customer_name,
      phone_number,
      email,
      booking_source,
      trip_status,
      trip_notes,
      created_by
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
    
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getAllTrips = async (req, res) => {
    try {
      const query = 'SELECT * FROM trip_master ORDER BY trip_date DESC;';
      const { rows } = await pool.query(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };

  const getTripsByVehicleNumber = async (req, res) => {
    const { vehicle_number } = req.params;
  
    if (!vehicle_number) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }
  
    try {
      const query = 'SELECT * FROM trip_master WHERE vehicle_number = $1 ORDER BY trip_date DESC;';
      const { rows } = await pool.query(query, [vehicle_number]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'No trips found for this vehicle number' });
      }
  
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching trips by vehicle number:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
  
  
module.exports = { vehicalMaster, driverMaster , createTrip,getAllTrips,getTripsByVehicleNumber };
