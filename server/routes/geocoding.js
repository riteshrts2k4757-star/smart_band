import { Router } from 'express';
import { searchPlaces, reverseSearch } from '../controllers/orsController.js';

const router = Router();

router.get('/search', searchPlaces);
router.get('/reverse', reverseSearch);

export default router;

