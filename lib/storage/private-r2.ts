import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function config() {
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  const endpoint = process.env.R2_S3_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const accessKeyId = process.env.R2_PRIVATE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_PRIVATE_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error("Private R2 is not configured");
  return { bucket, client: new S3Client({ endpoint, region: "auto", credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true }) };
}

export async function storePrivateSlip(key: string, bytes: Uint8Array, contentType: string) {
  const { bucket, client } = config();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType }));
  return `r2://${bucket}/${key}`;
}

function objectLocation(uri: string) {
  const { bucket, client } = config();
  const prefix = `r2://${bucket}/`;
  if (!uri.startsWith(prefix) || !["payment-slips/", "tenant-contracts/"].some(folder => uri.slice(prefix.length).startsWith(folder))) throw new Error("Invalid private asset");
  return { client, Bucket: bucket, Key: uri.slice(prefix.length) };
}

export async function readPrivateSlip(uri: string) {
  const { client, Bucket, Key } = objectLocation(uri);
  return client.send(new GetObjectCommand({ Bucket, Key }));
}

export async function deletePrivateSlip(uri: string) {
  const { client, Bucket, Key } = objectLocation(uri);
  await client.send(new DeleteObjectCommand({ Bucket, Key }));
}

export async function createPrivateUploadPresignedUrl(key: string, contentType: string, expiresIn = 600) {
  const { bucket, client } = config();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return {
    uploadUrl,
    fileUri: `r2://${bucket}/${key}`,
    key,
  };
}

export async function checkPrivateObjectExists(uri: string) {
  try {
    const { client, Bucket, Key } = objectLocation(uri);
    await client.send(new HeadObjectCommand({ Bucket, Key }));
    return true;
  } catch {
    return false;
  }
}
