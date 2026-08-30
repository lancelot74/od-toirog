import type { NextConfig } from "next";

const repository = "od-toirog";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: isGitHubPages ? `/${repository}` : "",
  assetPrefix: isGitHubPages ? `/${repository}/` : "",
};

export default nextConfig;
