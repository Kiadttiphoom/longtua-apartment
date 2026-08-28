import { createClient } from "@supabase/supabase-js";

const [usernameInput, password, displayNameInput] = process.argv.slice(2);
const username = String(usernameInput ?? "").trim().toLowerCase();
const displayName = String(displayNameInput ?? "Longtua Super Admin").trim();

if (!/^[a-z0-9][a-z0-9._-]{2,28}[a-z0-9]$/.test(username)) {
  console.error("Username ต้องเป็น a-z, 0-9, จุด, _ หรือ - จำนวน 4–30 ตัว");
  process.exit(1);
}
if (String(password ?? "").length < 12 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
  console.error("Password ต้องยาวอย่างน้อย 12 ตัว และมีทั้งตัวอักษรกับตัวเลข");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.AUTH_INTERNAL_EMAIL_DOMAIN?.trim().toLowerCase();
if (!url || !serviceRoleKey || !domain) {
  console.error(".env.local ขาด NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY หรือ AUTH_INTERNAL_EMAIL_DOMAIN");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: existingAlias, error: lookupError } = await admin
  .from("auth_login_aliases")
  .select("auth_user_id")
  .eq("username", username)
  .maybeSingle();
if (lookupError) throw lookupError;

let userId = existingAlias?.auth_user_id;
let createdUser = false;

try {
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
    });
    if (error) throw error;
  } else {
    const internalEmail = `${crypto.randomUUID()}@${domain}`;
    const { data, error } = await admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName },
    });
    if (error || !data.user) throw error ?? new Error("Supabase did not return the created user");
    userId = data.user.id;
    createdUser = true;

    const { error: aliasError } = await admin.from("auth_login_aliases").insert({
      username,
      auth_user_id: userId,
      internal_email: internalEmail,
    });
    if (aliasError) throw aliasError;

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      username,
      display_name: displayName,
      status: "active",
    });
    if (profileError) throw profileError;
  }

  const { error: adminError } = await admin.from("system_admins").upsert({ user_id: userId, status: "active" });
  if (adminError) throw adminError;
  console.log(`สร้าง Super Admin สำเร็จ: ${username}`);
} catch (error) {
  if (createdUser && userId) await admin.auth.admin.deleteUser(userId);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
