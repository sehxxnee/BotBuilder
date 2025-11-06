// src/server/domain/rag/usecases/uploadFile.ts

import { TRPCError } from '@trpc/server';
import { uploadFileToR2 } from '@/server/infrastructure/r2/client';

export interface UploadFileParams {
  fileName: string;
  fileType: string;
  fileData: string; // Base64 인코딩된 파일 데이터
}

export interface UploadFileResult {
  fileKey: string;
  success: boolean;
}

export async function uploadFileUsecase(
  params: UploadFileParams
): Promise<UploadFileResult> {
  try {
    // Base64 데이터를 Buffer로 변환
    const fileBuffer = Buffer.from(params.fileData, 'base64');
    
    // 파일 키 생성
    const fileKey = `rag-files/${Date.now()}-${params.fileName}`;
    
    // R2에 직접 업로드
    await uploadFileToR2(fileKey, fileBuffer, params.fileType);
    
    return {
      fileKey,
      success: true,
    };
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `파일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    });
  }
}
