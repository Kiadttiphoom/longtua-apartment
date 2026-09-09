import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
const Bucket = process.env.R2_PRIVATE_BUCKET_NAME;
if (Bucket !== "longtua-private-asset") throw new Error("Unexpected private bucket");
const client = new S3Client({ region: "auto", endpoint: process.env.R2_S3_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_PRIVATE_ACCESS_KEY_ID, secretAccessKey: process.env.R2_PRIVATE_SECRET_ACCESS_KEY }, maxAttempts: 1 });
const Key = `verification/${crypto.randomUUID()}.txt`;
let uploaded = false;
let stage = "upload";
try {
  await client.send(new PutObjectCommand({ Bucket, Key, Body: "private-storage-verification", ContentType: "text/plain" }));
  uploaded = true;
  stage = "read";
  const read = await client.send(new GetObjectCommand({ Bucket, Key }));
  if (await read.Body.transformToString() !== "private-storage-verification") throw new Error("Read mismatch");
  console.log("Private R2 upload/read verified");
} catch (error) {
  console.error(`R2 ${stage} failed: ${error.name} (${error.$metadata?.httpStatusCode ?? "unknown"})`);
  process.exitCode = 1;
} finally {
  if (uploaded) {
  await client.send(new DeleteObjectCommand({ Bucket, Key }));
  console.log("Verification object removed");
  }
}
