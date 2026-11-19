import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const [usernameInput, password, displayNameInput] = process.argv.slice(2);
const username = String(usernameInput ?? "").trim().toLowerCase();
const displayName = String(displayNameInput ?? "Longtua Super Admin").trim();

if (!/^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/.test(username)) {
  console.error("Username ต้องเป็น a-z, 0-9, จุด, _ หรือ - จำนวน 4–30 ตัว");
  process.exit(1);
}
if (String(password ?? "").length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
  console.error("Password ต้องยาวอย่างน้อย 8 ตัว และมีทั้งตัวอักษรกับตัวเลข");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
const domain = process.env.AUTH_INTERNAL_EMAIL_DOMAIN?.trim().toLowerCase() || "auth.longtua.com";

if (!databaseUrl) {
  console.error(".env.local ขาด DATABASE_URL");
  process.exit(1);
}

const isLocalhost = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
let cleanDbUrl = databaseUrl;
if (!isLocalhost && cleanDbUrl.includes("sslmode=")) {
  cleanDbUrl = cleanDbUrl.replace(/[\?&]sslmode=[^&]+/g, "");
  if (cleanDbUrl.endsWith("?")) cleanDbUrl = cleanDbUrl.slice(0, -1);
}
const pool = new Pool({
  connectionString: cleanDbUrl,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

const client = await pool.connect();

try {
  await client.query("BEGIN");

  // Check existing alias
  const aliasRes = await client.query(
    "SELECT auth_user_id FROM public.auth_login_aliases WHERE username = $1 LIMIT 1",
    [username],
  );

  let userId = aliasRes.rows[0]?.auth_user_id;
  const hashedPassword = await bcrypt.hash(password, 10);

  if (userId) {
    // Update existing user password
    await client.query(
      "UPDATE public.auth_login_aliases SET encrypted_password = $1 WHERE auth_user_id = $2",
      [hashedPassword, userId],
    );
    await client.query(
      "UPDATE auth.users SET encrypted_password = $1, updated_at = now() WHERE id = $2",
      [hashedPassword, userId],
    );
    console.log(`อัปเดตรหัสผ่านสำหรับ super admin '${username}' เรียบร้อยแล้ว`);
  } else {
    // Create new user
    userId = crypto.randomUUID();
    const internalEmail = `${crypto.randomUUID()}@${domain}`;
    const userMetadata = { username, display_name: displayName };

    await client.query(
      `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())`,
      [userId, internalEmail, hashedPassword, JSON.stringify(userMetadata)],
    );

    await client.query(
      `INSERT INTO public.auth_login_aliases (username, auth_user_id, internal_email, encrypted_password)
       VALUES ($1, $2, $3, $4)`,
      [username, userId, internalEmail, hashedPassword],
    );
    console.log(`สร้างบัญชี super admin '${username}' (${userId}) เรียบร้อยแล้ว`);
  }

  // Upsert profile
  await client.query(
    `INSERT INTO public.profiles (id, username, display_name, status, updated_at)
     VALUES ($1, $2, $3, 'active', now())
     ON CONFLICT (id) DO UPDATE
     SET username = EXCLUDED.username,
         display_name = EXCLUDED.display_name,
         status = 'active',
         updated_at = now()`,
    [userId, username, displayName],
  );

  // Upsert system_admins
  await client.query(
    `INSERT INTO public.system_admins (user_id, status, updated_at)
     VALUES ($1, 'active', now())
     ON CONFLICT (user_id) DO UPDATE
     SET status = 'active',
         updated_at = now()`,
    [userId],
  );

  await client.query("COMMIT");
  console.log(`กำหนดสิทธิ์ super admin ให้ '${username}' เรียบร้อยแล้ว`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("เกิดข้อผิดพลาดในการสร้าง super admin:", err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
