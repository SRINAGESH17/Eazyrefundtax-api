
require('dotenv').config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");


const bucketRegion = process.env.BUCKET_REGION;
const accessId = process.env.BUCKET_ACCESS_ID;
const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;

// Create a client

 const s3 = new S3Client({
  credentials: {
    accessKeyId: accessId,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

module.exports = s3;

