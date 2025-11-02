// src/server/services/r2.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// R2 자격 증명 검증
function validateR2Credentials() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
  
  // Access Key ID는 일반적으로 20자 또는 32자입니다 (AWS SDK는 32자를 기대)
  // Secret Access Key는 일반적으로 40자입니다
  if (accessKeyId.length === 40) {
    throw new Error(
      'R2_ACCESS_KEY_ID가 잘못 설정되었습니다. Access Key ID와 Secret Access Key가 서로 바뀌었을 가능성이 있습니다.'
    );
  }
}

// 초기화 시 자격 증명 검증
try {
  validateR2Credentials();
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    throw error;
  }
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

/**
 * 파일을 업로드할 수 있는 Presigned URL을 생성 
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string) {
  if (!R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME 환경 변수가 설정되지 않았습니다.');
  }
  
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
 * 파일을 R2에 직접 업로드 (백엔드 프록시 방식 - CORS 문제 회피)
 * @param fileKey - R2에 저장할 파일의 고유 키
 * @param fileBuffer - 업로드할 파일의 Buffer
 * @param contentType - 파일의 MIME 타입
 */
export async function uploadFileToR2(fileKey: string, fileBuffer: Buffer, contentType: string): Promise<void> {
  if (!R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME 환경 변수가 설정되지 않았습니다.');
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: contentType,
  });

  try {
    await r2Client.send(command);
  } catch (error: unknown) {
    let errorMessage = '알 수 없는 오류';
    
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Access Denied 오류에 대한 구체적인 안내
    if (errorMessage.includes('Access Denied') || errorMessage.includes('access denied')) {
      throw new Error(
        'R2 파일 업로드 실패: Access Denied. Access Key ID와 Secret Access Key를 확인하거나, ' +
        'Cloudflare R2 대시보드에서 새로운 API 토큰을 생성하세요.'
      );
    }

    throw new Error(`R2 파일 업로드 실패: ${errorMessage}`);
  }
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