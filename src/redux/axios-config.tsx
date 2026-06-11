import { createAPIUrl } from "@/lib/config";
import axios from "axios";
import { getSession, signOut } from "next-auth/react";

// Let an individual request force the Django backend even for a GET — used by
// reads that are NOT ported to the Next.js API (e.g. widget customization).
declare module "axios" {
    export interface AxiosRequestConfig {
        useBackend?: boolean;
    }
}

const axiosInstance = axios.create({
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});


axiosInstance.interceptors.request.use(
    async (config) => {
        // Route writes (POST/PUT/PATCH/DELETE) to the Django backend and reads
        // (GET) to this Next.js app's own /api routes. `useBackend: true` opts a
        // specific read back into Django.
        const isWrite = (config.method ?? "get").toLowerCase() !== "get";
        const target = config.useBackend || isWrite ? "django" : "local";
        config.baseURL = createAPIUrl(undefined, target);

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
    }
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
    }
);




export { axiosInstance };
