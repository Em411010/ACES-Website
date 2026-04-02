const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const activityStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "aces/activities",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const uploadActivity = multer({
  storage: activityStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

module.exports = { cloudinary, uploadActivity };
