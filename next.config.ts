import type { NextConfig } from "next";

const allowedDevOrigins = ["localhost", "127.0.0.1"];
const lanHost = process.env.AGENTIC_OS_LAN_HOST?.trim();
const privateHost = process.env.AGENTIC_OS_PRIVATE_HOST?.trim();

if (lanHost) allowedDevOrigins.push(lanHost);
if (privateHost) allowedDevOrigins.push(privateHost);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  devIndicators: false,
  turbopack: { root: process.cwd() },
};

export default nextConfig;
