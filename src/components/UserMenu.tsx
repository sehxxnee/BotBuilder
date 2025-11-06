// src/components/UserMenu.tsx

'use client';

import { api } from '@/app/trpc/client';
import { removeToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const router = useRouter();
  const { data: user } = api.auth.getCurrentUser.useQuery(undefined, {
    retry: false,
    // 인증되지 않은 경우 에러를 무시
    onError: () => {
      // 인증되지 않은 경우는 정상적인 상태이므로 에러를 무시
    },
  });

  const handleLogout = () => {
    removeToken();
    router.refresh();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">
        {user.name || user.email}
      </span>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        로그아웃
      </button>
    </div>
  );
}
