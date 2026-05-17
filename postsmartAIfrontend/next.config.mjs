/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["jspdf", "fflate"],

  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "https://postsmartia-backend.onrender.com/api"

    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig