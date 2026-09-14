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
};

export default nextConfig;
