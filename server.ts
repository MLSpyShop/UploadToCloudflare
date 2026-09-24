import express from 'express';
import { createServer as createViteServer } from 'vite';
import { 
  S3Client, 
  ListObjectsV2Command, 
  DeleteObjectCommand, 
  DeleteObjectsCommand, 
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

function getS3Client(req: express.Request) {
  const endpoint = req.headers['x-r2-endpoint'] as string || process.env.R2_ENDPOINT;
  const accessKeyId = req.headers['x-r2-access-key-id'] as string || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = req.headers['x-r2-secret-access-key'] as string || process.env.R2_SECRET_ACCESS_KEY;
  
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials. Please provide Endpoint, Access Key ID, and Secret Access Key.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

function getBucketName(req: express.Request): string {
  const bucket = req.headers['x-r2-bucket'] as string || process.env.R2_BUCKET_NAME;
  if (!bucket || !bucket.trim()) {
    throw new Error('Please specify a valid Cloudflare R2 Bucket Name.');
  }
  return bucket.trim();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes for R2
  app.post('/api/r2/test', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1,
      });
      await client.send(command);
      res.json({ success: true, message: 'Successfully connected to Cloudflare R2 bucket!' });
    } catch (error: any) {
      console.error('R2 Test Connection Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to connect to R2 bucket' });
    }
  });

  app.post('/api/r2/list', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { prefix = '', continuationToken, maxKeys = 100 } = req.body;

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: Number(maxKeys),
      });

      const response = await client.send(command);
      res.json({
        success: true,
        contents: response.Contents || [],
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken || null,
        commonPrefixes: response.CommonPrefixes || [],
      });
    } catch (error: any) {
      console.error('R2 List Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to list bucket objects' });
    }
  });

  app.post('/api/r2/presign-upload', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { key, contentType } = req.body;

      if (!key) {
        return res.status(400).json({ success: false, error: 'Missing file key' });
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      });

      const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      res.json({ success: true, presignedUrl });
    } catch (error: any) {
      console.error('R2 Presign Upload Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to generate upload URL' });
    }
  });

  app.post('/api/r2/presign-download', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { key } = req.body;

      if (!key) {
        return res.status(400).json({ success: false, error: 'Missing file key' });
      }

      const command = new PutObjectCommand({ // Note: S3GetCommand or GetObjectCommand
        Bucket: bucket,
        Key: key,
      });
      // We can use GetObjectCommand for download presigned URL
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(client, getCommand, { expiresIn: 3600 });
      res.json({ success: true, presignedUrl });
    } catch (error: any) {
      console.error('R2 Presign Download Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to generate download URL' });
    }
  });

  app.post('/api/r2/delete', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { keys } = req.body; // Array of strings

      if (!keys || !Array.isArray(keys) || keys.length === 0) {
        return res.status(400).json({ success: false, error: 'No keys provided for deletion' });
      }

      if (keys.length === 1) {
        const command = new DeleteObjectCommand({
          Bucket: bucket,
          Key: keys[0],
        });
        await client.send(command);
      } else {
        const command = new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((k) => ({ Key: k })),
            Quiet: true,
          },
        });
        await client.send(command);
      }

      res.json({ success: true, deletedCount: keys.length });
    } catch (error: any) {
      console.error('R2 Delete Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to delete objects' });
    }
  });

  // Multipart upload initializers for large files (> 5MB)
  app.post('/api/r2/multipart/create', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { key, contentType } = req.body;

      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      });

      const response = await client.send(command);
      res.json({ success: true, uploadId: response.UploadId });
    } catch (error: any) {
      console.error('R2 Multipart Create Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to create multipart upload' });
    }
  });

  app.post('/api/r2/multipart/presign-part', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { key, uploadId, partNumber } = req.body;

      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: Number(partNumber),
      });

      const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      res.json({ success: true, presignedUrl });
    } catch (error: any) {
      console.error('R2 Multipart Presign Part Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to generate part upload URL' });
    }
  });

  app.post('/api/r2/multipart/complete', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { key, uploadId, parts } = req.body; // parts: [{PartNumber, ETag}]

      const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber),
        },
      });

      const response = await client.send(command);
      res.json({ success: true, location: response.Location });
    } catch (error: any) {
      console.error('R2 Multipart Complete Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to complete multipart upload' });
    }
  });

  app.post('/api/r2/multipart/abort', async (req, res) => {
    try {
      const client = getS3Client(req);
      const bucket = getBucketName(req);
      const { key, uploadId } = req.body;

      const command = new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      });

      await client.send(command);
      res.json({ success: true });
    } catch (error: any) {
      console.error('R2 Multipart Abort Error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to abort multipart upload' });
    }
  });

  // Static files in production, Vite middleware in development
  const distPath = path.resolve(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
