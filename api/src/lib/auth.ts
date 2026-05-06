import { sign, verify } from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '30d';

export function generateAccessToken(userId: string, email: string, role: string): string {
  return sign(
    { sub: userId, email, role, type: 'access' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): string {
  return sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): { sub: string; email?: string; role?: string; type: string } | null {
  try {
    return verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
  } catch {
    return null;
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}