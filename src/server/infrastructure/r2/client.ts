import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { env } from '@/server/config/env';

function validateR2Credentials() {
  const accessKeyId = env.R2_ACCESS_KEY_ID || '';
  if (accessKeyId.length === 40) {
    throw new Error('R2_ACCESS_KEY_ID가 잘못 설정되었습니다. Access Key ID/Secret Access Key가 바뀌었을 수 있습니다.');
  }
}

try {
  validateR2Credentials();
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    throw error;
  }
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  },
});

const R2_BUCKET_NAME = env.R2_BUCKET_NAME || '';

export async function getPresignedUploadUrl(fileName: string, contentType: string) {
  if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME 환경 변수가 설정되지 않았습니다.');
  const fileKey = `rag-files/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileKey, ContentType: contentType });
  const url = await getSignedUrl(r2Client, command, { expiresIn: 60 });
  return { url, fileKey };
}

export async function uploadFileToR2(fileKey: string, fileBuffer: Buffer, contentType: string): Promise<void> {
  if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME 환경 변수가 설정되지 않았습니다.');
  const command = new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileKey, Body: fileBuffer, ContentType: contentType });
  try {
    await r2Client.send(command);
  } catch (error: unknown) {
    let errorMessage = '알 수 없는 오류';
    if (error && typeof error === 'object' && 'message' in error) errorMessage = String((error as any).message);
    else if (error instanceof Error) errorMessage = error.message;
    if (errorMessage.toLowerCase().includes('access denied')) {
      throw new Error('R2 파일 업로드 실패: Access Denied. 키 쌍 또는 권한을 확인하세요.');
    }
    throw new Error(`R2 파일 업로드 실패: ${errorMessage}`);
  }
}

export async function downloadFileAsBuffer(fileKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: fileKey });
  const response = await r2Client.send(command);
  if (!response.Body) throw new Error(`File not found or empty in R2 for key: ${fileKey}`);
  return streamToBuffer(response.Body as Readable);
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}


