const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { AppError } = require("./error.middleware");

const createStorage = (subfolder) => {
  const uploadPath = path.join(__dirname, `../uploads/${subfolder}`);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueSuffix);
    },
  });
};

const imageFileFilter = (req, file, cb) => {
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

  if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPG, JPEG, PNG, and WEBP image files are allowed", 400, "INVALID_FILE_TYPE"), false);
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

  if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError("Only PDF and standard image formats are allowed for verification documents", 400, "INVALID_FILE_TYPE"), false);
  }
};

const uploadProduct = multer({
  storage: createStorage("products"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
});

const uploadShop = multer({
  storage: createStorage("shops"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

const uploadDocument = multer({
  storage: createStorage("documents"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFileFilter,
});

module.exports = {
  uploadProduct,
  uploadShop,
  uploadDocument,
};
