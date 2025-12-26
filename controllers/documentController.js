import pool from "../config/db.js";
import { getIO } from "../config/socket.js";

/* ============================================================
   CONFIG – ALLOWED DOCUMENT TYPES
============================================================ */
const ALLOWED_DOCUMENT_TYPES = new Set([
  "license_front",
  "license_back",
  "car_registration",
]);

/* ============================================================
   DRIVER – UPLOAD DOCUMENT
   POST /api/documents/upload
============================================================ */
export const uploadDocument = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { doc_type } = req.body;

    if (!ALLOWED_DOCUMENT_TYPES.has(doc_type)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported document type",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileUrl = req.file.path;

    const result = await pool.query(
      `
      INSERT INTO driver_documents (driver_id, doc_type, file_url)
      VALUES ($1, $2, $3)
      RETURNING id, doc_type, uploaded_at
      `,
      [driverId, doc_type, fileUrl]
    );

    return res.status(201).json({
      success: true,
      message: "Document uploaded",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Upload Document Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};


/* ============================================================
   DRIVER – GET OWN DOCUMENTS
   GET /api/documents/me
============================================================ */
export const getMyDocuments = async (req, res) => {
  try {
    const driverId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        doc_type,
        status,
        file_url,
        uploaded_at,
        updated_at
      FROM driver_documents
      WHERE driver_id = $1
        AND doc_type = ANY($2)
      ORDER BY uploaded_at DESC
      `,
      [driverId, Array.from(ALLOWED_DOCUMENT_TYPES)]
    );

    return res.json({
      success: true,
      count: result.rowCount,
      documents: result.rows,
    });
  } catch (error) {
    console.error("Get My Documents Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch documents",
    });
  }
};

/* ============================================================
   ADMIN – UPDATE DOCUMENT STATUS
   PATCH /api/documents/:id/status
============================================================ */
export const updateDocumentStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // 🔐 Admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized action",
      });
    }

    const allowedStatuses = new Set(["pending", "approved", "rejected"]);
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    await client.query("BEGIN");

    const docResult = await client.query(
      `
      SELECT id, driver_id, doc_type, status
      FROM driver_documents
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (docResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const document = docResult.rows[0];

    // ⛔ Block unsupported document types
    if (!ALLOWED_DOCUMENT_TYPES.has(document.doc_type)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Document type no longer supported",
      });
    }

    // ⛔ Prevent duplicate updates
    if (document.status === status) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: `Document already ${status}`,
      });
    }

    const updateResult = await client.query(
      `
      UPDATE driver_documents
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, driver_id, doc_type, status, updated_at
      `,
      [status, id]
    );

    // 🔔 Notification
    const docName = document.doc_type.replace(/_/g, " ");
    let title, message;

    if (status === "approved") {
      title = "Document Approved";
      message = `Your ${docName} has been approved.`;
    } else {
      title = "Document Rejected";
      message = reason
        ? `Your ${docName} was rejected. Reason: ${reason}`
        : `Your ${docName} was rejected.`;
    }

    await client.query(
      `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, 'document')
      `,
      [document.driver_id, title, message]
    );

    await client.query("COMMIT");

    // 🔌 Emit socket AFTER commit
    try {
      const io = getIO();
      io.to(`driver_${document.driver_id}`).emit("notification", {
        title,
        message,
        type: "document",
        created_at: new Date().toISOString(),
      });
    } catch (socketError) {
      console.warn("Socket emit failed:", socketError.message);
    }

    return res.json({
      success: true,
      message: "Document status updated successfully",
      document: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update Document Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update document status",
    });
  } finally {
    client.release();
  }
};
