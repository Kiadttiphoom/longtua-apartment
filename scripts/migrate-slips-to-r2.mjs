import { Pool } from "pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const isApply = args.includes("--apply");
const isDryRun = !isApply || args.includes("--dry-run");

console.log(`=== สคริปต์ย้ายสลิปโอนเงินจาก Supabase Storage ไป Cloudflare R2 ===`);
console.log(`โหมดการทำงาน: ${isDryRun ? "DRY-RUN (ตรวจสอบอย่างเดียว ไม่เปลี่ยนแปลงข้อมูล)" : "APPLY (ดำเนินการย้ายจริง)"}\n`);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ข้อผิดพลาด: ขาด DATABASE_URL ใน environment variables");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_MIGRATION_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_MIGRATION_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("คำเตือน: ขาด SUPABASE_MIGRATION_URL หรือ SUPABASE_MIGRATION_SERVICE_KEY");
  console.warn("หากไม่มี credentials ของ Supabase Storage จะไม่สามารถดาวน์โหลดไฟล์เก่าได้\n");
}

const r2Endpoint = process.env.R2_S3_ENDPOINT;
const r2Bucket = process.env.R2_PRIVATE_BUCKET_NAME || "longtua-private-assets";
const r2AccessKey = process.env.R2_PRIVATE_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_PRIVATE_SECRET_ACCESS_KEY;
const r2Region = process.env.R2_REGION || "auto";

if (!r2Endpoint || !r2AccessKey || !r2SecretKey) {
  console.error("ข้อผิดพลาด: ขาดการกำหนดค่า Cloudflare R2 Private Bucket ใน environment variables");
  process.exit(1);
}

const s3Client = new S3Client({
  region: r2Region,
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKey,
    secretAccessKey: r2SecretKey,
  },
});

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

try {
  // Query legacy slips
  const res = await pool.query(
    `SELECT id, organization_id, tenant_id, slip_path, created_at 
     FROM public.payment_submissions 
     WHERE slip_path IS NOT NULL AND slip_path NOT LIKE 'r2://%'
     ORDER BY created_at ASC`,
  );

  const legacySlips = res.rows;
  console.log(`พบรายการสลิปเก่าที่ยังไม่ได้ย้ายไป R2: ${legacySlips.length} รายการ`);

  if (legacySlips.length === 0) {
    console.log("ยอดเยี่ยม! สลิปทั้งหมดอยู่ใน Cloudflare R2 แล้ว ไม่มีรายการต้องย้าย");
    process.exit(0);
  }

  console.log("\nรายการสลิปที่ต้องย้าย:");
  for (const s of legacySlips.slice(0, 10)) {
    console.log(`- ID: ${s.id} | Org: ${s.organization_id} | Path เดิม: ${s.slip_path}`);
  }
  if (legacySlips.length > 10) {
    console.log(`  ... และอีก ${legacySlips.length - 10} รายการ`);
  }

  if (isDryRun) {
    console.log("\n[DRY RUN สรุป]:");
    console.log(`- จำนวนที่ต้องย้าย: ${legacySlips.length} ไฟล์`);
    console.log(`- ปลายทาง R2 Bucket: ${r2Bucket}`);
    console.log("หากต้องการย้ายจริง ให้รันคำสั่ง: node scripts/migrate-slips-to-r2.mjs --apply");
    process.exit(0);
  }

  // Live Apply Mode
  if (!supabaseUrl || !supabaseKey) {
    console.error("ข้อผิดพลาด: การย้ายจริง (--apply) ต้องระบุ SUPABASE_MIGRATION_URL และ SUPABASE_MIGRATION_SERVICE_KEY เพื่อดาวน์โหลดไฟล์");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let migratedCount = 0;
  let errorCount = 0;

  for (const slip of legacySlips) {
    try {
      console.log(`กำลังประมวลผล [${slip.id}] Path: ${slip.slip_path}...`);

      // 1. Download legacy slip from Supabase Storage
      const { data: blob, error: downloadError } = await supabase.storage
        .from("payment-slips")
        .download(slip.slip_path);

      if (downloadError || !blob) {
        console.error(`  - ดาวน์โหลดจาก Supabase ล้มเหลว:`, downloadError?.message);
        errorCount++;
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      const contentType = blob.type || "application/octet-stream";
      const ext = contentType === "image/png" ? ".png" : ".jpg";
      const r2Key = `payment-slips/${slip.organization_id}/${slip.id}${ext}`;
      const r2Uri = `r2://${r2Bucket}/${r2Key}`;

      // 2. Upload to Cloudflare R2
      await s3Client.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: r2Key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      // 3. Verify destination object in R2
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: r2Bucket,
          Key: r2Key,
        }),
      );

      // 4. Update Database record
      await pool.query(
        "UPDATE public.payment_submissions SET slip_path = $1 WHERE id = $2",
        [r2Uri, slip.id],
      );

      console.log(`  ✓ ย้ายสำเร็จ -> ${r2Uri}`);
      migratedCount++;
    } catch (err) {
      console.error(`  ✗ เกิดข้อผิดพลาดกับรายการ ${slip.id}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n=== ผลการดำเนินงาน ===`);
  console.log(`สำเร็จ: ${migratedCount} รายการ`);
  console.log(`ล้มเหลว: ${errorCount} รายการ`);
} catch (err) {
  console.error("เกิดข้อผิดพลาดในการประมวลผล:", err);
  process.exit(1);
} finally {
  await pool.end();
}
