import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { calculateMatches, sendMatch, getMatchHistory, getMatchStats } from '../controllers/matchController';

const router = Router();
router.use(requireAuth);

router.post('/calculate/:id', calculateMatches);
router.post('/send', sendMatch);
router.get('/history/:customerId', getMatchHistory);
router.get('/stats', getMatchStats);

export default router;