import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { documentsUpload } from "../config/multerDocuments.js";
import {
  uploadDocument,
  getMyDocuments,
  updateDocumentStatus
} from "../controllers/documentController.js";

const router = express.Router();

// Driver uploads a document
router.post(
  "/upload",
  verifyToken,
  documentsUpload.single("file"),
  uploadDocument
);

// Driver gets all documents
router.get("/me", verifyToken, getMyDocuments);

// Admin updates document status
router.patch("/:id/status", updateDocumentStatus);

export default router;
