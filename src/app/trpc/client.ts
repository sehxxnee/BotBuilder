import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers';

// 백엔드 라우터의 타입 정보를 가져와 클라이언트 인스턴스를 생성
export const api = createTRPCReact<AppRouter>();