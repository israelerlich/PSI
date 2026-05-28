import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR/dev resources from common local hostnames so the client
  // bundle hydrates correctly when accessing via 127.0.0.1 or LAN IP.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.3",
    "192.168.1.0/24",
  ],
};

export default nextConfig;
