/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'miovtuyxvsxqfwpzoxmy.supabase.co',
      'localhost'
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ]
  }
}

module.exports = nextConfig
