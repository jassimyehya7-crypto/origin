/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  async headers() {
    return [
      {
        source: "/fondateur/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
