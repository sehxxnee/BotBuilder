// src/features/auth/AuthForm.tsx

'use client';

import { useState } from 'react';
import { api } from '@/app/trpc/client';
import { saveToken, removeToken } from '@/lib/auth';

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const signUpMutation = api.auth.signUp.useMutation();
  const signInMutation = api.auth.signIn.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        const result = await signUpMutation.mutateAsync({
          email,
          password,
          name: name || undefined,
        });
        saveToken(result.token);
        onSuccess?.();
      } else {
        const result = await signInMutation.mutateAsync({
          email,
          password,
        });
        saveToken(result.token);
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다.');
    }
  };

  const isLoading = signUpMutation.isPending || signInMutation.isPending;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg shadow-xl bg-white">
      <h2 className="text-2xl font-extrabold mb-6 text-indigo-700">
        {isSignUp ? '회원가입' : '로그인'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block mb-1 font-semibold text-gray-700">이름 (선택사항):</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="홍길동"
            />
          </div>
        )}

        <div>
          <label className="block mb-1 font-semibold text-gray-700">이메일:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            required
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold text-gray-700">비밀번호:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            required
            minLength={isSignUp ? 6 : 1}
            placeholder={isSignUp ? '최소 6자 이상' : '비밀번호 입력'}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-gray-400"
        >
          {isLoading ? '처리 중...' : (isSignUp ? '회원가입' : '로그인')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </button>
      </div>
    </div>
  );
}
