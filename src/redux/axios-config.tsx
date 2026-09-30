import { createAPIUrl } from "@/lib/config";
import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    // Every API is served by Django; this app has no data routes of its own.
    config.baseURL = createAPIUrl();

    try {
      const session = await getSession();
      const token = session?.user?.access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
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
    if (error.status === 401) {
      signOut({ callbackUrl: "/login" });
    }

    return Promise.reject(error);
  },
);

export { axiosInstance };
