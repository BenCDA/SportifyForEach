import crypto from 'crypto';
import { Request, Response, NextFunction, CookieOptions } from 'express';
import * as authService from './auth.service';
import { AuthRequest } from '../../middlewares/auth';
import { success } from '../../utils/response';

const isProd = process.env['NODE_ENV'] === 'production';

function setCookies(res: Response, accessToken: string, refreshToken: string): void {
  const base: CookieOptions = { httpOnly: true, secure: isProd, path: '/' };

  res.cookie('access_token', accessToken, {
    ...base,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refresh_token', refreshToken, {
    ...base,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // csrf_token: NOT httpOnly so the frontend JS can read and send it as a header
  res.cookie('csrf_token', crypto.randomBytes(32).toString('hex'), {
    httpOnly: false,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
}

function clearCookies(res: Response): void {
  const base: CookieOptions = { httpOnly: true, secure: isProd };
  res.clearCookie('access_token', { ...base, sameSite: 'lax', path: '/' });
  res.clearCookie('refresh_token', { ...base, sameSite: 'strict', path: '/api/auth' });
  res.clearCookie('csrf_token', { httpOnly: false, secure: isProd, sameSite: 'strict', path: '/' });
}

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body as Parameters<typeof authService.register>[0]);
    setCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json(success({ user: result.user }));
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body as Parameters<typeof authService.login>[0]);
    setCookies(res, result.accessToken, result.refreshToken);
    res.json(success({ user: result.user }));
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Cookie-first, body fallback for backward compatibility
    const token =
      (req.cookies as Record<string, string> | undefined)?.refresh_token ??
      (req.body as { refreshToken?: string }).refreshToken;

    if (!token) {
      clearCookies(res);
      res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Refresh token requis' } });
      return;
    }

    const result = await authService.refresh(token);
    setCookies(res, result.accessToken, result.refreshToken);
    res.json(success({ user: result.user }));
  } catch (err) {
    clearCookies(res);
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token =
      (req.cookies as Record<string, string> | undefined)?.refresh_token ??
      (req.body as { refreshToken?: string }).refreshToken;

    if (token) await authService.logout(token);
    clearCookies(res);
    res.status(204).send();
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
