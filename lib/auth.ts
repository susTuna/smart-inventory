import crypto from 'crypto';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  // Using Node.js crypto for password hashing
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, originalHash] = hash.split(':');
  const computedHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return computedHash === originalHash;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export type UserRole = 'admin' | 'worker';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  warehouse_id?: string;
  is_active: boolean;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  user: User;
}
