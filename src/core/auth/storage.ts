/**
 * Auth Storage
 *
 * User and session CRUD with JSON file storage.
 * Passwords hashed with crypto.scrypt (no external dependencies).
 *
 * Storage layout:
 *   content/auth/users.json    — StoredUser[]
 *   content/auth/sessions.json — Session[]
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { Role } from './types';
import { generateId } from '@/core/content/types';

// =============================================================================
// TYPES
// =============================================================================

export interface StoredUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

// =============================================================================
// FILE PATHS
// =============================================================================

const AUTH_DIR = path.join(process.cwd(), 'content', 'auth');
const USERS_FILE = path.join(AUTH_DIR, 'users.json');
const SESSIONS_FILE = path.join(AUTH_DIR, 'sessions.json');

// =============================================================================
// FILE HELPERS (mirrored from local content-provider)
// =============================================================================

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Directory exists
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// =============================================================================
// PASSWORD HASHING
// =============================================================================

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex');
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else resolve({ hash: derivedKey.toString('hex'), salt });
    });
  });
}

export function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else {
        const hashBuffer = Buffer.from(hash, 'hex');
        resolve(crypto.timingSafeEqual(derivedKey, hashBuffer));
      }
    });
  });
}

// =============================================================================
// USER CRUD
// =============================================================================

// In-memory cache for "has any users" check
let _hasUsers: boolean | null = null;

export async function hasAnyUsers(): Promise<boolean> {
  if (_hasUsers !== null) return _hasUsers;
  const users = await readJsonFile<StoredUser[]>(USERS_FILE);
  _hasUsers = users !== null && users.length > 0;
  return _hasUsers;
}

function invalidateUserCache(): void {
  _hasUsers = null;
}

export async function getUsers(): Promise<StoredUser[]> {
  return (await readJsonFile<StoredUser[]>(USERS_FILE)) ?? [];
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const users = await getUsers();
  const normalized = email.toLowerCase();
  return users.find((u) => u.email === normalized) ?? null;
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  role: Role;
}): Promise<StoredUser> {
  const users = await getUsers();
  const { hash, salt } = await hashPassword(data.password);

  const user: StoredUser = {
    id: generateId('user'),
    email: data.email.toLowerCase(),
    name: data.name,
    role: data.role,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeJsonFile(USERS_FILE, users);
  invalidateUserCache();
  return user;
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<StoredUser, 'name' | 'role' | 'lastLoginAt' | 'passwordHash' | 'salt'>>
): Promise<StoredUser | null> {
  const users = await getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  await writeJsonFile(USERS_FILE, users);
  return users[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;

  await writeJsonFile(USERS_FILE, filtered);
  invalidateUserCache();
  // Also delete all sessions for this user
  await deleteUserSessions(id);
  return true;
}

// =============================================================================
// SESSION CRUD
// =============================================================================

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getSessions(): Promise<Session[]> {
  return (await readJsonFile<Session[]>(SESSIONS_FILE)) ?? [];
}

export async function createSession(userId: string): Promise<Session> {
  const sessions = await getSessions();
  const now = new Date();

  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
  };

  sessions.push(session);
  await writeJsonFile(SESSIONS_FILE, sessions);
  return session;
}

export async function getSessionById(id: string): Promise<Session | null> {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === id);
  if (!session) return null;

  // Check if expired
  if (new Date(session.expiresAt) < new Date()) {
    // Auto-delete expired session
    await deleteSession(id);
    return null;
  }

  return session;
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length !== sessions.length) {
    await writeJsonFile(SESSIONS_FILE, filtered);
  }
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const sessions = await getSessions();
  const filtered = sessions.filter((s) => s.userId !== userId);
  if (filtered.length !== sessions.length) {
    await writeJsonFile(SESSIONS_FILE, filtered);
  }
}

export async function deleteExpiredSessions(): Promise<void> {
  const sessions = await getSessions();
  const now = new Date();
  const filtered = sessions.filter((s) => new Date(s.expiresAt) > now);
  if (filtered.length !== sessions.length) {
    await writeJsonFile(SESSIONS_FILE, filtered);
  }
}
