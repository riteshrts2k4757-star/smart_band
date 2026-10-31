import { Router } from 'express';
import { calculateRoute } from '../controllers/orsController.js';

const router = Router();

router.post('/', calculateRoute);

export default router;

