import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { calculateMatches, sendMatch } from '../controllers/matchController';

const router = Router();
router.use(requireAuth);

router.post('/calculate/:id', calculateMatches);
router.post('/send', sendMatch);

export default router;