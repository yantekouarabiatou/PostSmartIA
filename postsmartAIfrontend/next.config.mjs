/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["jspdf", "fflate"],

  // Proxy /api/backend/* → backend Laravel (évite les erreurs CORS en production)
  // En local  : BACKEND_URL=http://localhost:8001/api (via .env.local)
  // En prod   : BACKEND_URL=https://xxx.railway.app/api (via variable Vercel)
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:8001/api"

    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
