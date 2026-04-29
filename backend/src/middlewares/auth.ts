import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  // Cookie-first auth; fall back to Authorization header for API clients / tests
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.access_token;
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;

  const token = cookieToken ?? bearerToken;
  if (!token) {
    next(new AppError(401, 'UNAUTHORIZED', 'No token provided'));
    return;
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, 'TOKEN_INVALID', 'Invalid or expired token'));
  }
}
