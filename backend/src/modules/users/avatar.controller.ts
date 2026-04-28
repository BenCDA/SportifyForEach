import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { prisma } from '../../config/prisma';
import { processAvatar, safeDeleteFile } from '../uploads/uploads.service';
import { success } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export async function uploadAvatarHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError(400, 'NO_FILE', 'No file provided');

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    safeDeleteFile(user.avatarUrl);

    const avatarUrl = await processAvatar(req.file.buffer, user.id);
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });

    res.json(success({ avatarUrl }));
  } catch (err) {
    next(err);
  }
}

export async function deleteAvatarHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    safeDeleteFile(user.avatarUrl);
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
