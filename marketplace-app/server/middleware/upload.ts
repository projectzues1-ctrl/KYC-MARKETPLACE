import multer from "multer";
import path from "path";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx|xlsx|xls|csv|mp4|mov|avi|webm/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
  ];
  const mimetypeAllowed = allowedMimeTypes.includes(file.mimetype);

  if (mimetypeAllowed && extname) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed. Supported: images, PDF, Word, Excel, CSV, and video files"));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter,
});
