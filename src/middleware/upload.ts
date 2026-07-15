import multer from 'multer';
import { ApiError } from '../utils/ApiError';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(ApiError.badRequest('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});
