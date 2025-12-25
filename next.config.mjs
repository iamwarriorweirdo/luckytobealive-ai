/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  reactStrictMode: false, // Tắt strict mode để tránh render 3D 2 lần khi dev
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: 'canvas' }]; // Fix lỗi canvas server-side
    return config;
  },
};

export default nextConfig;