import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const prototypesDir = path.resolve(process.cwd(), 'uploads', 'prototypes');

if (!fs.existsSync(prototypesDir)) {
  fs.mkdirSync(prototypesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, prototypesDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension) ? extension : '.png';
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExtension}`;
    cb(null, name);
  }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('Unsupported image type'));
};

export const prototypeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
