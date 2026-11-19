import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Verify a plain text password against a bcrypt hash.
 * Supabase Auth (GoTrue) stores passwords as bcrypt hashes ($2a$ or $2b$),
 * so existing hashes in the database can be verified directly without password resets!
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error("[auth] Failed to compare password hash", err);
    return false;
  }
}

/**
 * Hash a plain text password using bcrypt with standard 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}
