/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "eyxczcbnxwxgxlyzdgcz.supabase.co", // ✅ Supabase storage domain
      "img.clerk.com", // ✅ Clerk profile images
    ],
  },
};

module.exports = nextConfig;
