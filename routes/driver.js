import express from "express";
import multer from "multer";
import supabase from "../config/supabaseClient.js";


const router = express.Router();

// ⚙️ Configure multer in-memory; we'll stream to Supabase Storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * 🚘 Add or Update Driver Vehicle Info
 * @route  POST /api/drivers/vehicle
 * @body   { driver_id, make, model, year, license_plate }
 * @files  revenue_licence, cert_of_fitness, driver_licence, photo_url
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

      // ⬆️ Upload each file to Supabase Storage (bucket: 'vehicle_docs')
      const uploadFile = async (file) => {
        if (!file) return null;
        const filePath = `${driver_id}/${Date.now()}_${file.originalname}`;
        const { data, error } = await supabase.storage
          .from("vehicle_docs")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });
        if (error) throw error;
        const { data: publicUrl } = supabase.storage
          .from("vehicle_docs")
          .getPublicUrl(filePath);
        return publicUrl.publicUrl;
      };

      const revenueLicenceUrl = await uploadFile(
        req.files.revenue_licence?.[0]
      );
      const certOfFitnessUrl = await uploadFile(
        req.files.cert_of_fitness?.[0]
      );
      const driverLicenceUrl = await uploadFile(req.files.driver_licence?.[0]);
      const photoUrl = await uploadFile(req.files.photo_url?.[0]);

      // 💾 Upsert vehicle record
      const { data, error } = await supabase
        .from("vehicles")
        .upsert(
          {
            driver_id,
            make,
            model,
            year,
            license_plate,
            revenue_licence: revenueLicenceUrl,
            cert_of_fitness: certOfFitnessUrl,
            driver_licence: driverLicenceUrl,
            photo_url: photoUrl,
          },
          { onConflict: "driver_id" }
        )
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: "Vehicle information uploaded successfully.",
        vehicle: data,
      });
    } catch (error) {
      console.error("❌ Vehicle upload error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to save vehicle info.",
        error: error.message,
      });
    }
  }
);

/**
 * 🔍 Supabase Connection Test
 * @route GET /api/drivers/db-test
 */
router.get("/db-test", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("drivers").select("id").limit(1);
    if (error) throw error;
    res.status(200).json({
      success: true,
      message: "Supabase connection successful 🎉",
      testRow: data?.[0] ?? null,
    });
  } catch (error) {
    console.error("❌ Supabase test failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Supabase connection failed ❌",
      error: error.message,
    });
  }
});

export default router;
