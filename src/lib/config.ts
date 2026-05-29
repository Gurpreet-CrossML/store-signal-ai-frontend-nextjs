export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";

export function createAPIUrl(path: string) {
    const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    const formattedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}/api${formattedPath}`;
}