import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import path from 'node:path';

const db = new DatabaseSync(process.env.DATABASE_PATH || path.join(process.cwd(), 'ats.sqlite'));
// Next.js may initialize this module in several worker processes simultaneously.
db.exec('PRAGMA busy_timeout = 10000');
db.exec('BEGIN IMMEDIATE');
try {
  db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, phone TEXT DEFAULT '', title TEXT DEFAULT '', education TEXT DEFAULT '', experience TEXT DEFAULT '', skills TEXT DEFAULT '', about TEXT DEFAULT '', resume_name TEXT DEFAULT '', resume_data TEXT DEFAULT ''); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, job_id INTEGER NOT NULL, status TEXT DEFAULT 'در انتظار بررسی', created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, job_id));`);
  if (!db.prepare("PRAGMA table_info(users)").all().some(column => column.name === 'profile_extra')) db.exec("ALTER TABLE users ADD COLUMN profile_extra TEXT DEFAULT '{}'");
  if (!db.prepare("PRAGMA table_info(applications)").all().some(column => column.name === 'job_title')) db.exec("ALTER TABLE applications ADD COLUMN job_title TEXT DEFAULT ''");
  db.exec("CREATE TABLE IF NOT EXISTS sharepoint_jobs(id INTEGER PRIMARY KEY, data TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)");
  db.exec("CREATE TABLE IF NOT EXISTS sharepoint_sync(key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
}
export { db };
export function hash(password, salt = randomBytes(16).toString('hex')) { return salt + ':' + scryptSync(password, salt, 64).toString('hex'); }
export function verify(password, stored) { const [salt, key] = stored.split(':'); const actual = scryptSync(password, salt, 64); return timingSafeEqual(actual, Buffer.from(key, 'hex')); }
export async function currentUser() { const token = (await cookies()).get('session')?.value; if (!token) return null; return db.prepare('SELECT users.* FROM users JOIN sessions ON sessions.user_id=users.id WHERE sessions.token=?').get(token) || null; }
export const cookiePath = process.env.NEXT_PUBLIC_BASE_PATH || '/';
export async function startSession(id) { const token = randomBytes(32).toString('hex'); db.prepare('INSERT INTO sessions VALUES (?,?)').run(token, id); (await cookies()).set('session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: cookiePath, maxAge: 60*60*24*7 }); }
export function safeUser(user) { if (!user) return null; const { password, resume_data, ...safe } = user; return safe; }
