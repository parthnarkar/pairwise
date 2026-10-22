import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { Matchmaker } from '../models';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
    const matchmaker = await Matchmaker.findById(req.matchmakerId);
    if (!matchmaker) {
        return res.status(404).json({ error: 'Matchmaker not found' });
    }
    return res.json({
        matchmaker: {
            id: matchmaker._id,
            name: matchmaker.name,
            email: matchmaker.email,
            assignedRegion: matchmaker.assignedRegion,
        },
    });
});

export default router;