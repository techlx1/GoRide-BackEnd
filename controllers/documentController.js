import pool from "../config/db.js";

/**
 * POST /api/documents/upload
 * Upload a document for a driver
 */
export const uploadDocument = async (req, res) => {
  try {
    const driverId = req.user.id; // Coming from verifyToken
    const { docType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    // Allowed document types
    const allowedTypes = [
      "license_front",
      "license_back",
      "vehicle_registration"
    ];

    if (!allowedTypes.includes(docType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type.",
      });
    }

    const fileUrl = `/uploads/documents/${file.filename}`;

    // Store in database
    const result = await pool.query(
      `
      INSERT INTO driver_documents (driver_id, doc_type, file_url, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
      `,
      [driverId, docType, fileUrl]
    );

    return res.json({
      success: true,
      message: "Document uploaded successfully.",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Upload Document Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading document.",
    });
  }
};

/**
 * GET /api/documents/me
 * Get all documents uploaded by the logged-in driver
 */
export const getMyDocuments = async (req, res) => {
  try {
    const driverId = req.user.id;

    const result = await pool.query(
      `
      SELECT id, doc_type, file_url, status, uploaded_at, updated_at
      FROM driver_documents
      WHERE driver_id = $1
      ORDER BY uploaded_at DESC
      `,
      [driverId]
    );

    return res.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    console.error("Get Documents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching documents.",
    });
  }
};

/**
 * PATCH /api/documents/:id/status
 * Admin updates document status (pending/approved/rejected)
 */
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    const result = await pool.query(
      `
      UPDATE driver_documents
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    return res.json({
      success: true,
      message: "Status updated successfully.",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating status.",
    });
  }
};
