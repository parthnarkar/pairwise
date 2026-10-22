import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import {
    listMyCustomers,
    listMyCities,
    getCustomerDetail,
    updateJourneyStatus,
    addNote,
} from '../controllers/customerController';

const router = Router();
router.use(requireAuth);
router.get('/', listMyCustomers);
router.get('/meta/cities', listMyCities);
router.get('/:id', getCustomerDetail);
router.patch('/:id/status', updateJourneyStatus);
router.post('/:id/notes', addNote);

export default router;