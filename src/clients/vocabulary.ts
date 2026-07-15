import { ENDPOINTS } from "@/lib/config";
import { axiosInstance } from "@/redux/axios-config";
import type { VocabularyPayload, VocabularyRecord } from "@/db/brand-voice";

export async function fetchVocabulary(storeCode: string) {
  const response = await axiosInstance.get(
    `${ENDPOINTS.fetchVocabulary()}?store_code=${encodeURIComponent(storeCode)}`,
  );
  return response.data.data as VocabularyRecord | null;
}

export async function saveVocabulary(
  storeCode: string,
  payload: VocabularyPayload,
) {
  const response = await axiosInstance.post(
    `${ENDPOINTS.saveVocabulary()}?store_code=${encodeURIComponent(storeCode)}`,
    payload,
  );
  return response.data.data as VocabularyRecord;
}
