import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { ApiError } from "./ApiError";

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        "INVALID_FILE_TYPE",
        "Only JPEG, PNG, WEBP, and GIF images are allowed"
      )
    );
  }
};

function makeImageUpload(dir: string, prefix: string) {
  const uploadRoot = path.resolve(process.cwd(), "uploads", dir);

  // Ensure upload directory exists
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
      if (!fs.existsSync(uploadRoot)) {
        fs.mkdirSync(uploadRoot, { recursive: true });
      }
      cb(null, uploadRoot);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter,
  });
}

export const uploadProfileImage = makeImageUpload("profiles", "profile");
export const uploadClubImage = makeImageUpload("clubs", "club");
export const uploadEventImage = makeImageUpload("events", "event");
