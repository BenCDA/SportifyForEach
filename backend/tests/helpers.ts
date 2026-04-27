import { signAccessToken, signRefreshToken } from '../src/utils/jwt';

export function makeAccessToken(userId: string, role: string): string {
  return signAccessToken({ userId, role });
}

export function makeRefreshToken(userId: string, role: string): string {
  return signRefreshToken({ userId, role });
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
