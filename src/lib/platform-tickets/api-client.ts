export async function callPlatformApi(
  platform: "freshdesk" | "zendesk",
  method: string,
  path: string,
  credentials: { apiUrl: string; apiKey: string; username?: string },
  body?: any,
): Promise<any> {
  const { apiUrl, apiKey, username } = credentials;

  if (!apiUrl) {
    throw new Error("API URL is required for platform API call");
  }
  if (!apiKey) {
    throw new Error("API Key is required for platform API call");
  }

  let authHeader = "";
  if (platform === "freshdesk") {
    // Freshdesk: API key as username, dummy password (e.g. "X")
    authHeader = `Basic ${Buffer.from(`${apiKey}:X`).toString("base64")}`;
  } else if (platform === "zendesk") {
    // Zendesk: {username}/token:{apiKey}
    if (!username) {
      throw new Error("Username is required for Zendesk API call");
    }
    authHeader = `Basic ${Buffer.from(`${username}/token:${apiKey}`).toString("base64")}`;
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  let formattedPath = path.startsWith("/") ? path : `/${path}`;

  if (baseUrl.includes("/api/v2") && formattedPath.startsWith("/api/v2/")) {
    formattedPath = formattedPath.slice(7);
  }

  const url = `${baseUrl}${formattedPath}`;

  const headers: Record<string, string> = {
    Authorization: authHeader,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Platform API error [${response.status}]: ${text || response.statusText}`,
    );
  }

  return response.json();
}
