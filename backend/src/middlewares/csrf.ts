import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * OWASP Double-Submit Cookie CSRF protection.
 *
 * Only applies when the request is cookie-authenticated (access_token cookie
 * is present). Requests using Bearer tokens (API clients, test suite) or with
 * no session at all bypass CSRF — the auth middleware will handle 401 in
 * those cases.
 */
export function csrfProtect(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) { next(); return; }

  // Bearer-authenticated callers are not cookie-driven; skip CSRF.
  if (req.headers.authorization?.startsWith('Bearer ')) { next(); return; }

  const cookies = req.cookies as Record<string, string> | undefined;

  // No cookie session present — auth middleware handles the 401.
  if (!cookies?.access_token) { next(); return; }

  // Cookie session is active: require the double-submit CSRF header.
  const cookieToken = cookies.csrf_token;
  const headerToken = req.headers['x-csrf-token'] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new AppError(403, 'CSRF_INVALID', 'CSRF token manquant ou invalide'));
    return;
  }
  next();
}
