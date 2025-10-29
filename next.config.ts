import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL('https://storage.googleapis.com/getshoot/uploads/**')],
  },
  env:{
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
  },
  output: 'standalone',
};

export default nextConfig;
