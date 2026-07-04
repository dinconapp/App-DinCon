import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => origin.replace(/^https?:\/\//i, "").split(":")[0]);

function getApiTarget() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8001/api";
  return apiUrl.endsWith("/api") ? apiUrl : `${apiUrl.replace(/\/$/, "")}/api`;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: allowedDevOrigins?.length ? allowedDevOrigins : ["localhost", "127.0.0.1"],
  async rewrites() {
    const target = getApiTarget();
    return [
      {
        source: "/api/:path*",
        destination: `${target}/:path*`
      }
    ];
  }
};

export default nextConfig;
