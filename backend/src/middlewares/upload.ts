import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG and WebP images are accepted'));
  }
};

const avatarMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('avatar');

const coverMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('cover');

function wrap(uploadFn: (req: Request, res: Response, cb: (err: unknown) => void) => void) {
  return (req: Request, _res: Response, next: NextFunction) => {
    uploadFn(req, _res, (err: unknown) => {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(400, 'FILE_TOO_LARGE', 'File exceeds the size limit'));
        }
        return next(new AppError(400, 'UPLOAD_ERROR', err.message));
      }
      next(err);
    });
  };
}

export const avatarUpload = wrap(avatarMulter);
export const coverUpload  = wrap(coverMulter);
