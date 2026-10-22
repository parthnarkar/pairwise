import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { calculateMatches } from '../controllers/matchController';

const router = Router();
router.use(requireAuth);

router.post('/calculate/:id', calculateMatches);

export default router;