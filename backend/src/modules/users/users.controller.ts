import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as usersService from './users.service';
import { success } from '../../utils/response';
import { Role } from '@prisma/client';

export async function listUsersHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1, limit = 10, role } = req.query as { page?: string; limit?: string; role?: string };
    const result = await usersService.listUsers(
      parseInt(String(page), 10),
      Math.min(parseInt(String(limit), 10), 100),
      role as Role | undefined,
    );
    res.json(success(result.users, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getMeHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getUserById(req.user!.userId);
    res.json(success(user));
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const updated = await usersService.updateUser(id, req.body as Parameters<typeof usersService.updateUser>[1]);
    res.json(success(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteUserHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await usersService.deleteUser(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
