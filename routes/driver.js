// routes/driver.js
import express from "express";
import multer from "multer";
import pool from "../config/db.js";

const router = express.Router();

// Configure multer (local storage, can later switch to Supabase)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder to store uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

/**
 * 🚘 Add or Update Driver Vehicle Info
 * Endpoint: POST /api/driver/vehicle
 * Body: { driver_id, make, model, year, license_plate }
 * Files: revenue_licence, cert_of_fitness, driver_licence, photo_url
 */
router.post(
  "/vehicle",
  upload.fields([
    { name: "revenue_licence", maxCount: 1 },
    { name: "cert_of_fitness", maxCount: 1 },
    { name: "driver_licence", maxCount: 1 },
    { name: "photo_url", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { driver_id, make, model, year, license_plate } = req.body;

      if (!driver_id || !make || !model || !year || !license_plate) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required." });
      }

      // Uploaded file URLs
      const revenueLicencePath = req.files.revenue_licence
        ? `/uploads/${req.files.revenue_licence[0].filename}`
        : null;

      const certOfFitnessPath = req.files.cert_of_fitness
        ? `/uploads/${req.files.cert_of_fitness[0].filename}`
        : null;

      const driverLicencePath = req.files.driver_licence
        ? `/uploads/${req.files.driver_licence[0].filename}`
        : null;

      const photoPath = req.files.photo_url
        ? `/uploads/${req.files.photo_url[0].filename}`
        : null;

      // Save to DB
      const result = await pool.query(
        `INSERT INTO public.vehicles 
          (driver_id, make, model, year, license_plate, revenue_licence, cert_of_fitness, driver_licence, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          driver_id,
          make,
          model,
          year,
          license_plate,
          revenueLicencePath,
          certOfFitnessPath,
          driverLicencePath,
          photoPath,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Vehicle information uploaded successfully.",
        vehicle: result.rows[0],
      });
    } catch (error) {
      console.error("❌ Error saving vehicle data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save vehicle info.",
        error: error.message,
      });
    }
  }
);

export default router;
