import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/role';
import { validate } from '../../middlewares/validate';
import { createSessionSchema, updateSessionSchema, listSessionsSchema, sessionIdSchema } from './sessions.schema';
import {
  listSessionsHandler,
  getSessionHandler,
  createSessionHandler,
  updateSessionHandler,
  deleteSessionHandler,
} from './sessions.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listSessionsSchema), listSessionsHandler);
router.get('/:id', validate(sessionIdSchema), getSessionHandler);
router.post('/', requireRole('COACH', 'ADMIN'), validate(createSessionSchema), createSessionHandler);
router.put('/:id', requireRole('COACH', 'ADMIN'), validate(updateSessionSchema), updateSessionHandler);
router.delete('/:id', requireRole('COACH', 'ADMIN'), validate(sessionIdSchema), deleteSessionHandler);

export default router;
