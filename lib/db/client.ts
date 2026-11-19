/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { QueryBuilder, executeRpc } from "./query-builder";
import { getClaims, getSession, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { query } from "./pool";
import crypto from "crypto";

export interface DatabaseClient {
  from: <T = any>(table: string) => QueryBuilder<T>;
  rpc: (name: string, params?: Record<string, any>) => Promise<any>;
  auth: {
    getClaims: () => Promise<{ data: { claims: { sub: string } | null }; error: null }>;
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: null }>;
    signInWithPassword: (credentials: {
      email?: string;
      password?: string;
    }) => Promise<{ data: { user: any; session: any } | null; error: any | null }>;
    signOut: () => Promise<{ error: null }>;
    admin: {
      createUser: (options: {
        email: string;
        password?: string;
        user_metadata?: Record<string, any>;
        email_confirm?: boolean;
      }) => Promise<{ data: { user: { id: string } | null }; error: any | null }>;
      updateUserById: (
        userId: string,
        attributes: { password?: string; user_metadata?: Record<string, any> },
      ) => Promise<{ data: { user: { id: string } | null }; error: any | null }>;
      deleteUser: (userId: string) => Promise<{ data: null; error: any | null }>;
    };
  };
}

export function createDatabaseClient(): DatabaseClient {
  return {
    from: <T = any>(table: string) => new QueryBuilder<T>(table),
    rpc: (name: string, params?: Record<string, any>) => executeRpc(name, params),
    auth: {
      getClaims,
      getUser: async () => {
        const session = await getSession();
        return {
          data: {
            user: session?.sub ? { id: session.sub } : null,
          },
          error: null,
        };
      },
      signInWithPassword: async ({ email, password }) => {
        if (!email || !password) {
          return {
            data: null,
            error: { message: "Invalid login credentials", code: "invalid_credentials" },
          };
        }

        try {
          // Find user by username or internal email from public.auth_login_aliases with fallback to auth.users
          const res = await query(
            `SELECT 
               COALESCE(a.auth_user_id, u.id) AS id,
               COALESCE(a.internal_email, u.email) AS email,
               COALESCE(a.encrypted_password, u.encrypted_password) AS encrypted_password,
               a.username
             FROM public.auth_login_aliases a
             FULL OUTER JOIN auth.users u ON u.id = a.auth_user_id
             WHERE a.username = $1 OR a.internal_email = $1 OR u.email = $1
             LIMIT 1`,
            [email.toLowerCase().trim()],
          );

          const user = res.rows[0];
          if (!user || !user.encrypted_password) {
            return {
              data: null,
              error: { message: "Invalid login credentials", code: "invalid_credentials" },
            };
          }

          const isValid = await verifyPassword(password, user.encrypted_password);
          if (!isValid) {
            return {
              data: null,
              error: { message: "Invalid login credentials", code: "invalid_credentials" },
            };
          }

          await setSessionCookie({
            sub: user.id,
            username: user.username,
          });

          return {
            data: {
              user: { id: user.id, email: user.email },
              session: { user: { id: user.id } },
            },
            error: null,
          };
        } catch (err: any) {
          return {
            data: null,
            error: { message: err.message || "Authentication error", code: "auth_error" },
          };
        }
      },
      signOut: async () => {
        await clearSessionCookie();
        return { error: null };
      },
      admin: {
        createUser: async ({ email, password, user_metadata }) => {
          try {
            const userId = crypto.randomUUID();
            const hashedPassword = password ? await hashPassword(password) : null;
            const now = new Date();

            await query(
              `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $5)
               RETURNING id`,
              [
                userId,
                email.toLowerCase().trim(),
                hashedPassword,
                JSON.stringify(user_metadata || {}),
                now,
              ],
            );

            return {
              data: { user: { id: userId } },
              error: null,
            };
          } catch (err: any) {
            return {
              data: { user: null },
              error: { message: err.message, code: err.code },
            };
          }
        },
        updateUserById: async (userId, { password, user_metadata }) => {
          try {
            if (password) {
              const hashedPassword = await hashPassword(password);
              await query(
                `UPDATE public.auth_login_aliases
                 SET encrypted_password = $1
                 WHERE auth_user_id = $2`,
                [hashedPassword, userId],
              );
              await query(
                `UPDATE auth.users 
                 SET encrypted_password = $1, updated_at = now()
                 WHERE id = $2`,
                [hashedPassword, userId],
              );
            }
            if (user_metadata) {
              await query(
                `UPDATE auth.users 
                 SET raw_user_meta_data = $1, updated_at = now()
                 WHERE id = $2`,
                [JSON.stringify(user_metadata), userId],
              );
            }
            return {
              data: { user: { id: userId } },
              error: null,
            };
          } catch (err: any) {
            return {
              data: { user: null },
              error: { message: err.message, code: err.code },
            };
          }
        },
        deleteUser: async (userId) => {
          try {
            await query(`DELETE FROM auth.users WHERE id = $1`, [userId]);
            return { data: null, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message, code: err.code } };
          }
        },
      },
    },
  };
}

export async function createClient(): Promise<DatabaseClient> {
  return createDatabaseClient();
}

export function createAdminClient(): DatabaseClient {
  return createDatabaseClient();
}
