// config/multerConfig.js
import multer from 'multer';
import path from 'path';

// Define storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // The folder where files will be saved
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname); // Get file extension
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1E9); // Generate a unique file name
    cb(null, uniqueSuffix + fileExtension); // Save the file with a unique name
  }
});

// Create multer instance with the storage configuration
const upload = multer({ storage });

export default upload; // Export multer instance using ES6 export
