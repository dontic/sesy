// @ts-nocheck
import type { ApiKey, ApiKeyRequest } from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * List all API keys in the application.
 */
export const sesyApiKeysList = (
  options?: SecondParameter<typeof customAxiosInstance<ApiKey[]>>,
) => {
  return customAxiosInstance<ApiKey[]>(
    { url: `/sesy/api-keys/`, method: "GET" },
    options,
  );
};
/**
 * Create a new named API key.
 */
export const sesyApiKeysCreate = (
  apiKeyRequest: ApiKeyRequest,
  options?: SecondParameter<typeof customAxiosInstance<ApiKey>>,
) => {
  return customAxiosInstance<ApiKey>(
    {
      url: `/sesy/api-keys/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: apiKeyRequest,
    },
    options,
  );
};
/**
 * Delete an API key.
 */
export const sesyApiKeysDestroy = (
  id: number,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/api-keys/${id}/`, method: "DELETE" },
    options,
  );
};
export type SesyApiKeysListResult = NonNullable<
  Awaited<ReturnType<typeof sesyApiKeysList>>
>;
export type SesyApiKeysCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyApiKeysCreate>>
>;
export type SesyApiKeysDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesyApiKeysDestroy>>
>;
