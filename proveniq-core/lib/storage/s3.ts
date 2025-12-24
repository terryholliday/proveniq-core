import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  // Warn but don't crash in dev, useful for UI development without credentials
  if (process.env.NODE_ENV === "development") {
    console.warn("Missing AWS credentials");
  }
}

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET || "proveniq-core-documents";
