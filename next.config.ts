/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { 
        protocol: 'https', 
        hostname: 'tevgdvbbvtbbdvytgllw.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**', // すべての公開バケットを許可
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', 
    },
  },
};

export default nextConfig;