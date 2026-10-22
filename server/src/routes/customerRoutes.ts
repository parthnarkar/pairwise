import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import {
    listMyCustomers,
    getCustomerDetail,
    updateJourneyStatus,
    addNote,
} from '../controllers/customerController';

const router = Router();
router.use(requireAuth);
router.get('/', listMyCustomers);
router.get('/:id', getCustomerDetail);
router.patch('/:id/status', updateJourneyStatus);
router.post('/:id/notes', addNote);

export default router;