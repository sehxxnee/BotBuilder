// src/server/domain/rag/usecases/getUploadUrl.ts

import { getPresignedUploadUrl } from '@/server/infrastructure/r2/client';

export interface GetUploadUrlParams {
  fileName: string;
  fileType: string;
}

export interface GetUploadUrlResult {
  uploadUrl: string;
  fileKey: string;
}

export async function getUploadUrlUsecase(
  params: GetUploadUrlParams
): Promise<GetUploadUrlResult> {
  // R2 서비스 함수를 호출하여 Presigned URL과 고유 Key를 받아옵니다.
  const { url, fileKey } = await getPresignedUploadUrl(
    params.fileName,
    params.fileType
  );
  
  return {
    uploadUrl: url,
    fileKey, // DB에 이 키를 저장하여 나중에 파일을 찾을 때 사용
  };
}
