import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // Optional public domain

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const uploadFile = async (fileBuffer, fileName, folder = "uploads", contentType) => {
  try {
    const uniqueFileName = `${folder}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: contentType,

    });

    await s3Client.send(command);

    // Return the URL
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL}/${uniqueFileName}`;
    }
    // Fallback to R2 dev URL or constructing it if not mapped
    return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${uniqueFileName}`;

  } catch (error) {
    console.error("R2 Upload Error:", error);
    throw new Error("File upload failed");
  }
};

export const generatePresignedUrl = async (fileName, fileType, folder = "uploads") => {
  try {
    const uniqueFileName = `${folder}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,

    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiration

    // Construct the public URL for the file (what will be stored in DB)
    let publicUrl;
    if (R2_PUBLIC_URL) {
      publicUrl = `${R2_PUBLIC_URL}/${uniqueFileName}`;
    } else {
      publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${uniqueFileName}`;
    }

    return {
      uploadUrl: url,
      key: uniqueFileName,
      publicUrl
    };

  } catch (error) {
    console.error("R2 Presigned URL Error:", error);
    throw new Error("Failed to generate presigned URL");
  }
};

export const deleteFile = async (fileUrl) => {
  try {
    // Extract key from URL
    let key = fileUrl;

    // If it's a full URL, try to extract the key
    if (fileUrl.startsWith('http')) {
      if (R2_PUBLIC_URL && fileUrl.startsWith(R2_PUBLIC_URL)) {
        key = fileUrl.replace(`${R2_PUBLIC_URL}/`, '');
      } else if (fileUrl.includes(BUCKET_NAME)) {
        const urlParts = fileUrl.split(BUCKET_NAME + '/');
        if (urlParts.length >= 2) key = urlParts[1];
      }
    }

    console.log(`Deleting file from R2 with key: ${key}`);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("R2 Delete Error:", error);
    // Don't throw error to prevent blocking main flow, just log it
    return false;
  }
}

export default {
  uploadFile,
  generatePresignedUrl,
  deleteFile
};
