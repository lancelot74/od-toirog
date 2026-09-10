import type { NextConfig } from "next";

const repository = "od-toirog";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? `/${repository}` : "" },
  images: {
    unoptimized: true,
  },
  basePath: isGitHubPages ? `/${repository}` : "",
  assetPrefix: isGitHubPages ? `/${repository}/` : "",
};

export default nextConfig;
