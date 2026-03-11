const { resolve } = require("path");

// Load env vars from root .env in local dev; on Vercel they're injected automatically
try {
  require("dotenv").config({ path: resolve(__dirname, "../.env") });
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
