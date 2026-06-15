import type { NextConfig } from "next";

// Vercel: SUPABASE_URL + SUPABASE_ANON_KEY (ohne NEXT_PUBLIC_, dürfen Sensitive sein)
// werden beim Build ins Frontend übernommen
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const nextConfig: NextConfig = {
  env: {
    ...(supabaseUrl ? { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl } : {}),
    ...(supabaseAnonKey
      ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey }
      : {}),
    ...(appUrl ? { NEXT_PUBLIC_APP_URL: appUrl } : {}),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
