/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      config.cache = false
    }
    return config
  },
}

export default nextConfig
