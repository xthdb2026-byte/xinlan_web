/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 生产构建输出 standalone 模式，生成最小化独立运行包
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'trae-api-cn.mchost.guru',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // 产品图为本地生成的 SVG 插画，需允许 SVG 通过 next/image 渲染
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 生产环境压缩
  poweredByHeader: false,
  compress: true,
  // 代理 /uploads 和 /api 到后端，避免跨域 + 提供同源默认回退
  async rewrites() {
    // 后端 base URL：读取 NEXT_PUBLIC_API_BASE 或默认值
    // NEXT_PUBLIC_API_BASE 支持以下格式：
    //   - http://127.0.0.1:3001/api → 解析为 http://127.0.0.1:3001
    //   - http://127.0.0.1:3001    → 直接使用
    //   - 空 / 未设置              → 默认 http://127.0.0.1:3001
    const envVal = process.env.NEXT_PUBLIC_API_BASE ?? '';
    let upstream = 'http://127.0.0.1:3001';
    if (envVal) {
      upstream = envVal.replace(/\/api\/?$/, '').replace(/\/$/, '');
    }
    return [
      {
        source: '/api/:path*',
        destination: `${upstream}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${upstream}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
