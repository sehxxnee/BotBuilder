// src/server/services/r2.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// R2 클라이언트 초기화 
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * 파일을 업로드할 수 있는 Presigned URL을 생성 
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string) {
  const fileKey = `rag-files/${Date.now()}-${fileName}`; 

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  }); 
  
  const url = await getSignedUrl(r2Client, command, { expiresIn: 60 });  
  return { url, fileKey };
}

/**
 * R2에 저장된 파일을 다운로드하여 Node.js Buffer 형태로 반환
 * @param fileKey - R2에 저장된 파일의 고유 키
 * @returns 파일 내용을 담은 Buffer
 */
export async function downloadFileAsBuffer(fileKey: string): Promise<Buffer> {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
        throw new Error(`File not found or empty in R2 for key: ${fileKey}`);
    }
 
    return streamToBuffer(response.Body as Readable); 
}

// Node.js Stream을 Buffer로 변환하는 유틸리티
function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}