import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { listMyCustomers } from '../controllers/customerController';

const router = Router();

router.get('/', requireAuth, listMyCustomers);

export default router;