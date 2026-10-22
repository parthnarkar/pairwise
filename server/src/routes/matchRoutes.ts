import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { calculateMatches, sendMatch, getMatchHistory, getMatchStats, revokeMatch, getGlobalMatchHistory } from '../controllers/matchController';

const router = Router();
router.use(requireAuth);

router.post('/calculate/:id', calculateMatches);
router.post('/send', sendMatch);
router.get('/stats', getMatchStats);
router.get('/history', getGlobalMatchHistory);
router.get('/history/:customerId', getMatchHistory);
router.delete('/:id', revokeMatch);

export default router;