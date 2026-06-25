import withPWAInit from "next-pwa";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/[^/]+\/api\//i,
      handler: "NetworkOnly",
      options: {
        cacheName: "ronda-smart-api-network-only"
      }
    },
    {
      urlPattern: /^https?:\/\/[^/]+\/(admin|master|mobile|assinar)(\/|$)/i,
      handler: "NetworkOnly",
      options: {
        cacheName: "ronda-smart-private-network-only"
      }
    },
    {
      urlPattern: /^https?.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "ronda-smart-public-v2",
        expiration: {
          maxEntries: 80,
          maxAgeSeconds: 24 * 60 * 60
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: projectRoot
};

export default withPWA(nextConfig);
