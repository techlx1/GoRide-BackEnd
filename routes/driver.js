import express from "express";
const router = express.Router();

/**
 * 🚘 Driver Vehicle Endpoint
 * Mock data — replace with Supabase query later
 */
router.get("/vehicle", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      vehicle: {
        make: "Toyota",
        model: "Corolla",
        year: "2020",
        licensePlate: "GY-1234-AB",
        fuelLevel: 75,
        mileage: 125000,
        status: "Active",
      },
    });
  } catch (error) {
    console.error("Error fetching vehicle info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle info",
    });
  }
});

export default router;
