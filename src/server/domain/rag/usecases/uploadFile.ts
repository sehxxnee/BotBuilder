import { TRPCError } from '@trpc/server';
import { uploadFileToR2 } from '@/server/infrastructure/r2/client';

export interface UploadFileParams {
  fileName: string;
  fileType: string;
  fileData: string;
}

export interface UploadFileResult {
  fileKey: string;
  success: boolean;
}

export async function uploadFileUsecase(
  params: UploadFileParams
): Promise<UploadFileResult> {
  try {
    const fileBuffer = Buffer.from(params.fileData, 'base64');
    const fileKey = `rag-files/${Date.now()}-${params.fileName}`;
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
