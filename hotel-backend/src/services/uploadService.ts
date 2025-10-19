import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';


let cloudinary: any = null;
let CloudinaryStorage: any = null;

try {
   
  cloudinary = require('cloudinary').v2;
  CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
  
  
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
} catch (error) {
  console.log('Cloudinary not configured, using local storage only');
}

 
export interface UploadResult {
  success: boolean;
  message?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
}


const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = 'uploads/';
    
     
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
     
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, path.parse(safeFilename).name + '-' + uniqueSuffix + fileExtension);
  }
});

 
let cloudinaryStorage: any = null;
if (cloudinary && CloudinaryStorage && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'hotel-backend',
      format: async (_req: Request, file: Express.Multer.File) => {
        const extension = path.extname(file.originalname).toLowerCase();
        switch (extension) {
          case '.jpg':
          case '.jpeg':
            return 'jpg';
          case '.png':
            return 'png';
          case '.gif':
            return 'gif';
          case '.pdf':
            return 'pdf';
          default:
            return 'jpg';
        }
      },
      public_id: (_req: Request, file: Express.Multer.File) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
        return safeName + '-' + uniqueSuffix;
      },
    },
  });
}

 
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`));
  }
};

 
const selectedStorage = cloudinaryStorage || storage;


export const upload = multer({
  storage: selectedStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  
  }
});

 
export class UploadService {
   
  static validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }
 
  static validateFileSize(file: Express.Multer.File, maxSizeInMB: number): boolean {
    const maxSize = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSize;
  }

  
  static getFileExtension(mimetype: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
    };
    return extensions[mimetype] || 'bin';
  }
 
  static deleteLocalFile(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  
  static async uploadToCloudinary(filePath: string, folder: string = 'hotel-backend'): Promise<UploadResult> {
    if (!cloudinary) {
      return {
        success: false,
        message: 'Cloudinary not configured'
      };
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'auto'
      });

      return {
        success: true,
        message: 'File uploaded to Cloudinary successfully',
        fileUrl: result.secure_url,
        fileName: result.original_filename,
        fileSize: result.bytes
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        message: 'Failed to upload file to Cloudinary'
      };
    }
  }
 
  static handleSingleFileUpload(file: Express.Multer.File): UploadResult {
    if (!file) {
      return {
        success: false,
        message: 'No file uploaded'
      };
    }

    
    let fileUrl: string;
    if (process.env.CLOUDINARY_CLOUD_NAME && file.path && file.path.startsWith('http')) {
      fileUrl = file.path; 
    } else {
      fileUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${file.filename}`;
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      filePath: file.path
    };
  }

   
  static handleMultipleFileUpload(files: Express.Multer.File[]): UploadResult[] {
    if (!files || files.length === 0) {
      return [{
        success: false,
        message: 'No files uploaded'
      }];
    }

    return files.map(file => this.handleSingleFileUpload(file));
  }
 
  static isCloudinaryConfigured(): boolean {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && cloudinary);
  }
}

export default UploadService;
