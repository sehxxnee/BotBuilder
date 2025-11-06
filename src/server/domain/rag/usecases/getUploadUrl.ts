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
  const { url, fileKey } = await getPresignedUploadUrl(
    params.fileName,
    params.fileType
  );
  
  return {
    uploadUrl: url,
    fileKey,
  };
}
