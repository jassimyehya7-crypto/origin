/** @type {import('next').NextConfig} */
function supabaseHostname() {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (u) return new URL(u).hostname;
  } catch {
    /* ignore */
  }
  return "wjqgcdrqkkihmsfihwtj.supabase.co";
}

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/pro",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/pro/reservations",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/reservations",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
