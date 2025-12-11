import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { documentsUpload } from "../config/multerDocuments.js";
import {
  uploadDocument,
  getMyDocuments,
  updateDocumentStatus
} from "../controllers/documentController.js";

const router = express.Router();

/* ============================================================
   DRIVER UPLOAD DOCUMENT
============================================================ */
router.post(
  "/upload",
  verifyToken,
  documentsUpload.single("file"),
  uploadDocument
);

/* ============================================================
   DRIVER – GET THEIR OWN DOCUMENTS
============================================================ */
router.get("/me", verifyToken, getMyDocuments);

/* ============================================================
   ADMIN – UPDATE VERIFICATION STATUS (APPROVE / REJECT)
============================================================ */
router.patch(
  "/:id/status",
  verifyToken,
  updateDocumentStatus
);

export default router;
