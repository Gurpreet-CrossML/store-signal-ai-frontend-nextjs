"use client";

import { ENDPOINTS } from "@/lib/config";
import type { AxiosResponse } from "axios";
import { axiosInstance } from "@/redux/axios-config";

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

export async function fetchStoreIntegrations(storeId: number) {
  const response = await axiosInstance.get(
    ENDPOINTS.fetchStoreIntegrations(storeId),
    {
      useBackend: true,
      requireAuth: true,
    },
  );

  return unwrapResponse<unknown>(response);
}

export async function fetchStoreIntegrationDetail(
  storeId: number,
  storeIntegrationRowId: number,
) {
  const response = await axiosInstance.get(
    ENDPOINTS.updateStoreIntegration(storeId, storeIntegrationRowId),
    {
      useBackend: true,
      requireAuth: true,
    },
  );

  return unwrapResponse<{
    id: number;
    stored_attributes: { code: string; value: string }[];
  }>(response);
}

export type {
  CoreIntegration,
  IntegrationAttribute,
} from "@/lib/integration-types";

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
