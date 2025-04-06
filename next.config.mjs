/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-supabase-project-id.supabase.co'],
  },
  webpack: (config) => {
    // Ensure PDF.js worker can be loaded properly
    config.resolve.alias.pdfjs = 'pdfjs-dist/legacy/build/pdf';

    config.module.rules.push({
      test: /pdf\.worker\.min\.js$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
