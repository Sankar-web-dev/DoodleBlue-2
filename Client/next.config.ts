import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["miovtuyxvsxqfwpzoxmy.supabase.co", "localhost"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.API_INTERNAL_URL || "http://localhost:5000"
        }/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
