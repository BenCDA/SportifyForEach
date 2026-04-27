import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { AuthRequest } from '../../middlewares/auth';
import { success } from '../../utils/response';

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body as Parameters<typeof authService.register>[0]);
    res.status(201).json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body as Parameters<typeof authService.login>[0]);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await authService.refresh(refreshToken);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.getMe(req.user!.userId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
