const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function testS3() {
  try {
    console.log('Testing S3 upload...');
    
    const command = new PutObjectCommand({
      Bucket: 'alliance-chemical-applications-2024',
      Key: 'test/quick.txt',
      Body: 'test content',
      ServerSideEncryption: 'AES256'
    });
    
    await s3.send(command);
    console.log('✅ S3 upload successful!');
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
  }
}

testS3();