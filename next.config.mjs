/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Cloudinary URLs already carry their own transformations (f_auto,q_auto,w_*), so we use plain <img> tags
  // and skip the Next.js image optimiser to avoid double processing and Vercel image quotas.
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/buy", destination: "/sale", permanent: true },
      { source: "/properties-for-rent", destination: "/rent", permanent: true },
      { source: "/properties-for-sale", destination: "/sale", permanent: true },
    ];
  },
};

export default nextConfig;
