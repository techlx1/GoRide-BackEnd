import pool from "../config/db.js";

/**
 * PATCH /api/documents/:id/status
 * Admin updates document status + sends notification
 */
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // 1️⃣ Validate status
    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    // 2️⃣ Get document info
    const docResult = await pool.query(
      `
      SELECT driver_id, doc_type 
      FROM driver_documents
      WHERE id = $1
      `,
      [id]
    );

    if (docResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const { driver_id, doc_type } = docResult.rows[0];

    // 3️⃣ Update status
    const updateResult = await pool.query(
      `
      UPDATE driver_documents
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    // 4️⃣ Build notification
    let title = "";
    let message = "";

    if (status === "approved") {
      title = "Document Approved";
      message = `Your ${doc_type.replace("_", " ")} has been approved.`;
    }

    if (status === "rejected") {
      title = "Document Rejected";
      message = reason
        ? `Your ${doc_type.replace("_", " ")} was rejected. Reason: ${reason}`
        : `Your ${doc_type.replace("_", " ")} was rejected.`;
    }

    // 5️⃣ Insert notification only for approved/rejected
    if (status !== "pending") {
      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, 'document')
        `,
        [driver_id, title, message]
      );
    }

    return res.json({
      success: true,
      message: "Status updated successfully.",
      document: updateResult.rows[0],
    });

  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating document status.",
      error: error.message,
    });
  }
};
