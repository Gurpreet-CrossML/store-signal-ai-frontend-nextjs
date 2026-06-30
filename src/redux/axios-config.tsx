import { createAPIUrl } from "@/lib/config";
import axios from "axios";
import { getSession, signOut } from "next-auth/react";

// Let an individual request force the Django backend even for a GET — used by
// reads that are NOT ported to the Next.js API (e.g. widget customization).
declare module "axios" {
  export interface AxiosRequestConfig {
    useBackend?: boolean;
    requireAuth?: boolean;
  }
}

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

async function getRequestToken() {
  if (typeof window !== "undefined") {
    const localKeys = ["access_token", "token", "authToken"];
    for (const key of localKeys) {
      const value = window.localStorage.getItem(key);
      if (value) return value;
    }
  }

  const session = await getSession();
  return session?.user?.access_token ?? null;
}

axiosInstance.interceptors.request.use(
  async (config) => {
    // Route writes (POST/PUT/PATCH/DELETE) to the Django backend and reads
    // (GET) to this Next.js app's own /api routes. `useBackend: true` opts a
    // specific read back into Django.
    const isWrite = (config.method ?? "get").toLowerCase() !== "get";
    const target = config.useBackend || isWrite ? "django" : "local";
    config.baseURL = createAPIUrl(undefined, target);

    try {
      const token = await getRequestToken();
      if (config.requireAuth) {
        console.log("[axios] auth token present:", Boolean(token));
        if (!token) {
          throw new Error(
            "Missing auth token. Please sign in again before managing integrations.",
          );
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      if (config.requireAuth) {
        return Promise.reject(error);
      }
      console.error("Error retrieving session:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      signOut({ callbackUrl: "/login" });
    }

    return Promise.reject(error);
  },
);

export { axiosInstance };
