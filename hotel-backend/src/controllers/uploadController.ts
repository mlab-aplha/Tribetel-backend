import { Request, Response } from 'express';
import { upload, UploadService } from '../services/uploadService';

export class UploadController {
   
  static uploadSingle = async (req: Request, res: Response): Promise<void> => {
    try {
      upload.single('file')(req, res, async (err) => {
        if (err) {
          res.status(400).json({
            success: false,
            message: err.message
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
          return;
        }

        const result = UploadService.handleSingleFileUpload(req.file);
        res.json(result);
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during upload'
      });
    }
  };

   
  static uploadMultiple = async (req: Request, res: Response): Promise<void> => {
    try {
      upload.array('files', 10)(req, res, async (err) => {
        if (err) {
          res.status(400).json({
            success: false,
            message: err.message
          });
          return;
        }

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
          res.status(400).json({
            success: false,
            message: 'No files uploaded'
          });
          return;
        }

        const files = req.files as Express.Multer.File[];
        const results = UploadService.handleMultipleFileUpload(files);
        
        res.json({
          success: true,
          message: `${files.length} files uploaded successfully`,
          results
        });
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during upload'
      });
    }
  };

   
  static uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
    try {
      upload.single('profilePicture')(req, res, async (err) => {
        if (err) {
          res.status(400).json({
            success: false,
            message: err.message
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({
            success: false,
            message: 'No profile picture uploaded'
          });
          return;
        }

         
        if (!req.file.mimetype.startsWith('image/')) {
          res.status(400).json({
            success: false,
            message: 'Only image files are allowed for profile pictures'
          });
          return;
        }

        const result = UploadService.handleSingleFileUpload(req.file);
        res.json(result);
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during upload'
      });
    }
  };
}

export default UploadController;
