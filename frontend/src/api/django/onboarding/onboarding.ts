// @ts-nocheck
import type { OnboardingResponse } from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyOnboardingRetrieve = (
  options?: SecondParameter<typeof customAxiosInstance<OnboardingResponse>>,
) => {
  return customAxiosInstance<OnboardingResponse>(
    { url: `/sesy/onboarding/`, method: "GET" },
    options,
  );
};
export type SesyOnboardingRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyOnboardingRetrieve>>
>;
