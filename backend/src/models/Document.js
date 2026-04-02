const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // Legacy single-file fields (kept for backward compatibility)
    fileUrl: { type: String, required: true },
    storageName: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: String, default: "" },
    fileType: { type: String, default: "PDF" },

    // Preferred paired-file fields
    pdfUrl: { type: String, default: "" },
    pdfStorageName: { type: String, default: "" },
    pdfFileName: { type: String, default: "" },
    pdfFileSize: { type: String, default: "" },

    docxUrl: { type: String, default: "" },
    docxStorageName: { type: String, default: "" },
    docxFileName: { type: String, default: "" },
    docxFileSize: { type: String, default: "" },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
