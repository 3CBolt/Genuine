/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    // Add resolve alias for TensorFlow.js
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tensorflow/tfjs$': '@tensorflow/tfjs/dist/tf.js',
    };
    return config;
  },
};

export default nextConfig; 