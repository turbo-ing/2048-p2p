import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        o1js: path.resolve(__dirname, "node_modules/o1js/dist/web/index.js"),
      };
    } else {
      config.externals.push("o1js"); // https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages
    }
    config.experiments = { ...config.experiments, topLevelAwait: true };
    config.optimization.minimizer = [];

    return config;
  },
  // To enable o1js for the web, we must set the COOP and COEP headers.
  // See here for more information: https://docs.minaprotocol.com/zkapps/how-to-write-a-zkapp-ui#enabling-coop-and-coep-headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://explorer.turbo.ing/;",
          },
          {
            // Relax Cross-Origin-Opener-Policy for iframe compatibility
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            // Relax Cross-Origin-Embedder-Policy for iframe compatibility
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",

          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  output: "export",
  reactStrictMode: false,
};

export default nextConfig;
