import { NextFunction, Request, Response } from "express";
import fs from "fs";
import httpStatus from "http-status";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../errors/app_error";

export const uploadDir = path.join(process.cwd(), "uploads");
const csvDir = path.join(uploadDir, "csv");
const imageDir = path.join(uploadDir, "images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(csvDir)) {
  fs.mkdirSync(csvDir, { recursive: true });
}
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const memoryImageStorage = multer.memoryStorage();
const csvStorage = multer.memoryStorage();

// File filter for image files
const imageFileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        httpStatus.BAD_REQUEST,
        "Only JPEG, PNG, or WEBP images are allowed",
      ),
      false,
    );
  }
};

// File filter for CSV files
const csvFileFilter = (req: any, file: any, cb: any) => {
  if (
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.originalname.toLowerCase().endsWith(".csv")
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(httpStatus.BAD_REQUEST, "Only CSV files are allowed"),
      false,
    );
  }
};

// Memory-storage image upload — future e eita R2/S3 e forward korar
// jonno use hobe (buffer lage bole memoryStorage)
export const upload = multer({
  storage: memoryImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Knowledge-base documents forwarded to the AI backend.
//
// Browsers disagree about markdown's mimetype (text/markdown, text/plain, or
// application/octet-stream depending on OS and how the file was created), so
// the extension is the reliable check — which is also what the AI backend
// itself validates on. The 20MB ceiling matches its cap exactly, so an
// oversized file is rejected here instead of after a full upload to the
// other VPS.
const markdownFileFilter = (req: any, file: any, cb: any) => {
  if (/\.(md|markdown)$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        httpStatus.BAD_REQUEST,
        "Only Markdown (.md/.markdown) files are supported",
      ),
      false,
    );
  }
};

export const markdownUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: markdownFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// CSV — just parse kore DB te insert korar jonno, disk e save korar
// dorkar nei, tai memoryStorage e buffer hisebe thakbe
export const csvUpload = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Generic local-disk image upload — kono field name-e (avatar, image,
// photo, jekono naam) use kora jabe, jemon: imageUpload.single("avatar")
// ba imageUpload.single("image"). Apatoto local disk e save hocche,
// future e R2/S3 e move korle just eikhane storage change korte hobe,
// route/controller er logic touch korte hobe na.
const localImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const imageUpload = multer({
  storage: localImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Extend Express's File type so req.file.url TypeScript-friendly hoy
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        url?: string;
      }
    }
  }
}

// diskStorage diye upload howar por file er upore ekta ready-made
// public URL boshiye dei — controller e r `/uploads/images/${filename}`
// likhte hobe na, sudhu req.file.url use korle e hobe.
// Future e R2/S3 e move korle eituku middleware e async kore
// upload-to-cloud logic boshiye dile e hobe, route/controller change lagbe na.
export const attachFileUrl = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.file) {
    req.file.url = `/uploads/images/${req.file.filename}`;
  }
  next();
};
