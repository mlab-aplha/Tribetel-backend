import { Router } from 'express';
import { getRooms, getRoomById,createRoom,updateRoom } from '../controllers/roomController';
 

const router = Router();

router.get('/',getRooms);
router.get('/:id',getRoomById);
router.post('/',createRoom);
router.put('/:id',updateRoom);

export default router;