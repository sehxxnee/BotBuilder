 

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers';

// 클라이언트 측에서 사용할 tRPC 인스턴스
export const api = createTRPCReact<AppRouter>();