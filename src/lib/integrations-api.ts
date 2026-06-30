"use client";

import { ENDPOINTS, createAPIUrl } from "@/lib/config";
import type { AxiosResponse } from "axios";
import { axiosInstance } from "@/redux/axios-config";

export type IntegrationCategory = "support" | "chat" | string;

export type CoreIntegration = {
  id: number;
  name: string;
  logo: string | null;
  logo_url: string | null;
  description: string;
  is_active: boolean;
  category: {
    id: number | null;
    category: IntegrationCategory;
  };
  category_label: string,
  steps_for_creds: string;
  scope: string | string[] | null;
};

export type IntegrationAttribute = {
  code: string;
  display_name: string;
  type: "text" | "url" | string;
  is_required: boolean;
};

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  detail?: string;
  error?: string;
};

function unwrapResponse<T>(response: AxiosResponse<ApiEnvelope<T> | T>): T {
  const payload = response.data as ApiEnvelope<T> | T | null;

  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as ApiEnvelope<T>).data ?? null) as T;
  }

  return (payload as T) ?? (null as T);
}

export async function fetchCoreIntegrations() {
  const response = await axiosInstance.get(
    createAPIUrl("/core/integrations/", "django"),
    {
      useBackend: true,
    },
  );

  return unwrapResponse<CoreIntegration[]>(response);
}

export async function fetchIntegrationAttributes(integrationId: number) {
  const response = await axiosInstance.get(
    createAPIUrl(`/core/integrations/${integrationId}/attributes/`, "django"),
    {
      useBackend: true,
      requireAuth: true,
    },
  );

  return unwrapResponse<unknown[]>(response);
}

export async function fetchStoreIntegrations(storeId: number) {
  const response = await axiosInstance.get(
    ENDPOINTS.fetchStoreIntegrations(storeId),
    {
      useBackend: true,
      requireAuth: true,
    },
  );

  return unwrapResponse<unknown[]>(response);
}

export async function testStoreIntegrationConnection(
  storeId: number,
  integrationId: number,
  attributeValues: Record<string, string>,
) {
  const response = await axiosInstance.post(
    ENDPOINTS.testStoreIntegrationConnection(storeId),
    {
      integration_id: integrationId,
      attribute_values: attributeValues,
    },
    {
      useBackend: true,
      requireAuth: true,
    },
  );

  return unwrapResponse<unknown>(response);
}

export async function connectStoreIntegration(
  storeId: number,
  integrationId: number,
  attributeValues?: Record<string, string>,
) {
  const payload: Record<string, unknown> = {
    integration: integrationId,
    store: storeId,
  };
  if (attributeValues) {
    payload.attribute_values = attributeValues;
  }

  const response = await axiosInstance.post(
    ENDPOINTS.createStoreIntegration(storeId),
    payload,
    {
      useBackend: true,
      requireAuth: true,
    },
  );

  return unwrapResponse<unknown>(response);
}
