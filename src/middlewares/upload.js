const multer = require('multer');
const path = require('path');
const fs = require('fs');

function getUploader(subDir) {
  const uploadDir = path.join(__dirname, '..', 'uploads', subDir);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + path.extname(file.originalname);
      cb(null, uniqueSuffix);
    }
  });

  return multer({ storage });
}

module.exports = getUploader;
