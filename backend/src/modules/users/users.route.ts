import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/role';
import { validate } from '../../middlewares/validate';
import { avatarUpload } from '../../middlewares/upload';
import { listUsersSchema, updateUserSchema, userIdSchema } from './users.schema';
import { listUsersHandler, getMeHandler, updateUserHandler, deleteUserHandler } from './users.controller';
import { uploadAvatarHandler, deleteAvatarHandler } from './avatar.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getMeHandler);
router.post('/me/avatar', avatarUpload, uploadAvatarHandler);
router.delete('/me/avatar', deleteAvatarHandler);
router.get('/', requireRole('ADMIN'), validate(listUsersSchema), listUsersHandler);
router.put('/:id', requireRole('ADMIN'), validate(updateUserSchema), updateUserHandler);
router.delete('/:id', requireRole('ADMIN'), validate(userIdSchema), deleteUserHandler);

export default router;
