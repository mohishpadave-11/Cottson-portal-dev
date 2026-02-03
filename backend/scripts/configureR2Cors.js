import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.BUCKET_NAME;

if (!R2_ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    console.error("❌ Missing required environment variables.");
    process.exit(1);
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
});

const run = async () => {
    console.log(`Configuring CORS for bucket: ${BUCKET_NAME}...`);

    try {
        const command = new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["PUT", "POST", "GET", "DELETE", "HEAD"],
                        AllowedOrigins: ["http://localhost:5173", "http://localhost:3000", "*"], // Allow local dev and wildcard
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000,
                    },
                ],
            },
        });

        await s3Client.send(command);
        console.log("✅ Successfully configured CORS for R2 bucket!");
    } catch (error) {
        console.error("❌ Error configuring CORS:", error);
    }
};

run();
