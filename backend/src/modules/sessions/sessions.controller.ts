import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as sessionsService from './sessions.service';
import { success } from '../../utils/response';

export async function listSessionsHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to, coachId, q, page = '1', limit = '10' } = req.query as Record<string, string>;
    const result = await sessionsService.listSessions(
      parseInt(page, 10),
      Math.min(parseInt(limit, 10), 100),
      { from, to, coachId, q },
    );
    res.json(success(result.sessions, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getSessionHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await sessionsService.getSessionById(
      String(req.params['id']),
      req.user!.userId,
      req.user!.role,
    );
    res.json(success(session));
  } catch (err) {
    next(err);
  }
}

export async function createSessionHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await sessionsService.createSession(
      req.user!.userId,
      req.body as Parameters<typeof sessionsService.createSession>[1],
    );
    res.status(201).json(success(session));
  } catch (err) {
    next(err);
  }
}

export async function updateSessionHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const session = await sessionsService.updateSession(
      id,
      req.user!.userId,
      req.user!.role,
      req.body as Parameters<typeof sessionsService.updateSession>[3],
    );
    res.json(success(session));
  } catch (err) {
    next(err);
  }
}

export async function deleteSessionHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await sessionsService.deleteSession(String(req.params['id']), req.user!.userId, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
