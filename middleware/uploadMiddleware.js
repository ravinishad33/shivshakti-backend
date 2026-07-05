const multer = require('multer');
const path = require('path');

// 1. Configure storage destination and file naming conventions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure you create an 'uploads' folder at your backend root!
  },
  filename: (req, file, cb) => {
    // e.g., profile-1719834256-photo.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 2. Validate file types (Images Only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, and PNG image files are allowed!'), false);
  }
};

// 3. Define field expectations (Maximum 2MB per file)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
}).fields([
  { name: 'aadhaarPhoto', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]);

module.exports = upload;