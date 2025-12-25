/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  reactStrictMode: false, // Tắt strict mode để tránh 3D canvas bị mount 2 lần
  webpack: (config) => {
    // Sửa lỗi import canvas trong một số thư viện 3D khi chạy server-side
    config.externals.push({ canvas: 'canvas' });
    return config;
  },
};

export default nextConfig;