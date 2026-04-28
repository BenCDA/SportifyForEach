import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { prisma } from '../../config/prisma';
import { processSessionCover, safeDeleteFile } from '../uploads/uploads.service';
import { success } from '../../utils/response';
import { AppError } from '../../utils/AppError';

export async function uploadCoverHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError(400, 'NO_FILE', 'No file provided');

    const session = await prisma.session.findUnique({ where: { id: String(req.params['id']) } });
    if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found');

    if (req.user!.role !== 'ADMIN' && session.coachId !== req.user!.userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only edit your own sessions');
    }

    safeDeleteFile(session.coverImageUrl);

    const coverImageUrl = await processSessionCover(req.file.buffer, session.id);
    await prisma.session.update({ where: { id: session.id }, data: { coverImageUrl } });

    res.json(success({ coverImageUrl }));
  } catch (err) {
    next(err);
  }
}

export async function deleteCoverHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await prisma.session.findUnique({ where: { id: String(req.params['id']) } });
    if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Session not found');

    if (req.user!.role !== 'ADMIN' && session.coachId !== req.user!.userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only edit your own sessions');
    }

    safeDeleteFile(session.coverImageUrl);
    await prisma.session.update({ where: { id: session.id }, data: { coverImageUrl: null } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
