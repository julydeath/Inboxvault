/** @type {import('next').NextConfig} */
const config = {
  // Keep visual QA and production builds from overwriting one another.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  devIndicators: false,
  poweredByHeader: false,
};
export default config;
