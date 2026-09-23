import { isAxiosError } from "axios";

// Extract a human readable message from a DRF error response
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return fallback;

  const messages: string[] = [];
  for (const value of Object.values(data as Record<string, unknown>)) {
    if (typeof value === "string") messages.push(value);
    else if (Array.isArray(value)) {
      messages.push(...value.filter((v): v is string => typeof v === "string"));
    }
  }
  return messages.length > 0 ? messages.join(" ") : fallback;
};
