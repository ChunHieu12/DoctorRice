import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    deletePhoto,
    getPhotoById,
    getPhotos,
    getPhotosForMap,
    getPhotoStats,
    uploadPhoto,
} from '../controllers/photo.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG/PNG images are allowed'));
  },
});

// Photo management
router.post('/upload', auth, upload.single('photo'), uploadPhoto);
router.get('/', auth, getPhotos);
router.get('/stats', auth, getPhotoStats);
router.get('/map', auth, getPhotosForMap);
router.get('/:id', auth, getPhotoById);
router.delete('/:id', auth, deletePhoto);

export default router;

