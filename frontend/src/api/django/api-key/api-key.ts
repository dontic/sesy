// @ts-nocheck
import type { ApiKey } from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyApiKeyRetrieve = (
  options?: SecondParameter<typeof customAxiosInstance<ApiKey>>,
) => {
  return customAxiosInstance<ApiKey>(
    { url: `/sesy/api-key/`, method: "GET" },
    options,
  );
};
/**
 * Create an API key if none exists, or regenerate the existing one.
 */
export const sesyApiKeyCreate = (
  options?: SecondParameter<typeof customAxiosInstance<ApiKey>>,
) => {
  return customAxiosInstance<ApiKey>(
    { url: `/sesy/api-key/`, method: "POST" },
    options,
  );
};
export type SesyApiKeyRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyApiKeyRetrieve>>
>;
export type SesyApiKeyCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyApiKeyCreate>>
>;
