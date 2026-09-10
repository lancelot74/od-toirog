export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const asset = (path: string) => `${basePath}${path}`;
export const siteUrl = (path: string) => `${window.location.origin}${basePath}${path}`;
