import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Turbopack 오류를 피하기 위해 웹팩 사용 (필요시 주석 해제)
  // webpack: (config, { isServer }) => {
  //   return config;
  // },
};

export default nextConfig;
