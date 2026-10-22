import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import {
    listMyCustomers,
    listMyCities,
    getCustomerDetail,
    updateJourneyStatus,
    addNote,
} from '../controllers/customerController';
import { listCandidatePool } from '../controllers/candidateController';

const router = Router();
router.use(requireAuth);
router.get('/', listMyCustomers);
router.get('/meta/cities', listMyCities);
router.get('/candidates', listCandidatePool);
router.get('/:id', getCustomerDetail);
router.patch('/:id/status', updateJourneyStatus);
router.post('/:id/notes', addNote);

export default router;