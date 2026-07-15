import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import type { ToneStylePayload, ToneStyleRecord } from "@/db/brand-voice";

export async function fetchToneStyle(storeCode: string) {
  const response = await axiosInstance.get(
    `${ENDPOINTS.fetchToneStyle()}?store_code=${encodeURIComponent(storeCode)}`,
  );
  return response.data.data as ToneStyleRecord | null;
}

export async function saveToneStyle(
  storeCode: string,
  payload: ToneStylePayload,
) {
  const response = await axiosInstance.post(
    `${ENDPOINTS.saveToneStyle()}?store_code=${encodeURIComponent(storeCode)}`,
    payload,
  );
  return response.data.data as ToneStyleRecord;
}
