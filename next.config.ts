/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'tevgdvbbvtbbdvytgllw.supabase.co' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // 1MBから4MBに拡張
    },
  },
};

export default nextConfig;