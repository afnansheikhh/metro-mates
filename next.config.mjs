/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Firebase Storage URLs (for any existing photos already uploaded)
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],

    // Allow base64 data URLs
    dangerouslyAllowSVG: false,
    unoptimized: true,
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;