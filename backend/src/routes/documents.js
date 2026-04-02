const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const router = require("express").Router();

const Document = require("../models/Document");
const { authenticate, checkPerm } = require("../middleware/auth");
const { audit } = require("../utils/auditLogger");

const uploadDir = path.join(process.cwd(), "uploads", "documents");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

function hasExt(fileName, ext) {
  return path.extname(fileName || "").toLowerCase() === ext;
}

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

// List all documents
router.get("/", authenticate, async (_req, res) => {
  const docs = await Document.find()
    .populate({ path: "uploadedBy", select: "fullName roleId", populate: { path: "roleId", select: "name color" } })
    .sort({ createdAt: -1 });
  res.json(docs);
});

// Upload a document
router.post(
  "/",
  authenticate,
  checkPerm("MANAGE_DOCUMENTS"),
  upload.fields([
    { name: "pdfFile", maxCount: 1 },
    { name: "docxFile", maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files || {};
    const pdfFile = Array.isArray(files.pdfFile) ? files.pdfFile[0] : null;
    const docxFile = Array.isArray(files.docxFile) ? files.docxFile[0] : null;

    if (!pdfFile || !docxFile) {
      return res.status(400).json({ error: "Both PDF and DOCX files are required" });
    }

    if (!hasExt(pdfFile.originalname, ".pdf")) {
      return res.status(400).json({ error: "pdfFile must be a .pdf file" });
    }
    if (!hasExt(docxFile.originalname, ".docx")) {
      return res.status(400).json({ error: "docxFile must be a .docx file" });
    }

    const explicitTitle = (req.body.title || "").trim();
    const title = explicitTitle || path.parse(pdfFile.originalname).name;

    const doc = await Document.create({
      title,
      // Legacy fields set to PDF to remain backward compatible in old clients.
      fileUrl: `/uploads/documents/${pdfFile.filename}`,
      storageName: pdfFile.filename,
      fileName: pdfFile.originalname,
      fileSize: formatFileSize(pdfFile.size),
      fileType: "PDF",
      pdfUrl: `/uploads/documents/${pdfFile.filename}`,
      pdfStorageName: pdfFile.filename,
      pdfFileName: pdfFile.originalname,
      pdfFileSize: formatFileSize(pdfFile.size),
      docxUrl: `/uploads/documents/${docxFile.filename}`,
      docxStorageName: docxFile.filename,
      docxFileName: docxFile.originalname,
      docxFileSize: formatFileSize(docxFile.size),
      uploadedBy: req.user._id,
    });

    const populated = await Document.findById(doc._id).populate({
      path: "uploadedBy",
      select: "fullName roleId",
      populate: { path: "roleId", select: "name color" },
    });

    await audit(req, {
      action: "UPLOAD_DOCUMENT",
      module: "DOCUMENT",
      targetType: "Document",
      targetId: doc._id,
      details: `Uploaded document "${title}"`,
      metadata: { title, pdfFile: pdfFile.originalname, docxFile: docxFile.originalname },
    });

    res.status(201).json(populated);
  }
);

function resolveVariant(doc, variant = "pdf") {
  if (variant === "docx") {
    return {
      storageName: doc.docxStorageName,
      fileName: doc.docxFileName,
    };
  }

  return {
    storageName: doc.pdfStorageName || doc.storageName,
    fileName: doc.pdfFileName || doc.fileName,
  };
}

// Download a document (default: pdf)
router.get("/:id/download", authenticate, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const variant = (req.query.variant || "pdf").toString().toLowerCase();
  const target = resolveVariant(doc, variant);
  if (!target.storageName || !target.fileName) {
    return res.status(404).json({ error: `No ${variant.toUpperCase()} file found for this document` });
  }

  const filePath = path.join(uploadDir, target.storageName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Stored file not found" });
  }

  res.download(filePath, target.fileName);
});

// Download a specific file variant
router.get("/:id/download/:variant", authenticate, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const variant = (req.params.variant || "pdf").toLowerCase();
  if (!["pdf", "docx"].includes(variant)) {
    return res.status(400).json({ error: "Variant must be pdf or docx" });
  }

  const target = resolveVariant(doc, variant);
  if (!target.storageName || !target.fileName) {
    return res.status(404).json({ error: `No ${variant.toUpperCase()} file found for this document` });
  }

  const filePath = path.join(uploadDir, target.storageName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Stored file not found" });
  }

  res.download(filePath, target.fileName);
});

// Preview metadata (PDF-first for iframe preview)
router.get("/:id/preview", authenticate, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const storageName = doc.pdfStorageName || doc.storageName;
  const filePath = path.join(uploadDir, storageName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Stored file not found" });
  }

  res.json({
    type: "pdf",
    url: doc.pdfUrl || doc.fileUrl,
  });
});

// Delete a document
router.delete("/:id", authenticate, checkPerm("MANAGE_DOCUMENTS"), async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const candidates = [
    doc.storageName,
    doc.pdfStorageName,
    doc.docxStorageName,
  ].filter(Boolean);

  for (const name of candidates) {
    const filePath = path.join(uploadDir, name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await audit(req, {
    action: "DELETE_DOCUMENT",
    module: "DOCUMENT",
    targetType: "Document",
    targetId: doc._id,
    details: `Deleted document "${doc.title}"`,
  });

  await Document.findByIdAndDelete(req.params.id);
  res.json({ message: "Document deleted" });
});

module.exports = router;
