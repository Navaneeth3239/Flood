import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `geotiff-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.tif', '.tiff', '.geotiff'];

  if (allowedExtensions.includes(ext) || file.mimetype.includes('tiff') || file.mimetype.includes('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid elevation file format. Only GeoTIFF (.tif, .tiff) files are supported.'));
  }
};

export const uploadGeoTiff = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 150 * 1024 * 1024, // 150 MB max
  },
});

export const uploadPhotoMiddleware = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `photo-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});


