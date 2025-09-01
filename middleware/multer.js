const multer = require('multer');

// use memoryStorage to upload directly to Supabase
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10 MB
  fileFilter: (req, file, cb) => {
    cb(null, true); // allow all files (or add restrictions if needed)
  },
});

module.exports = upload;
