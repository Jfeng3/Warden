const { resolve } = require("path");
require("dotenv").config({ path: resolve(__dirname, "../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
