import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';

const router = Router();


router.post('/single', UploadController.uploadSingle);
router.post('/multiple', UploadController.uploadMultiple);
router.post('/profile-picture', UploadController.uploadProfilePicture);

export default router;
