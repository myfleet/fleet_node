


const pool = require('../config/db'); // PostgreSQL connection pool

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

module.exports = { vehicalMaster, driverMaster };
