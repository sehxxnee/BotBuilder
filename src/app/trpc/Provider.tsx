'use client';  

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import superjson from 'superjson';

import { api } from './client';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // QueryClient는 캐싱, 재시도 등을 관리합니다.
  const [queryClient] = useState(() => new QueryClient());
  
  // tRPC 클라이언트 설정
  // tRPC v11에서는 transformer를 링크 레벨에 설정해야 함
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          // Next.js API 엔드포인트를 가리킵니다.
          url: '/api/trpc',
          // tRPC v11에서는 transformer를 링크 레벨에 설정
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}