// @ts-nocheck
import type {
  SESConfiguration,
  SESConfigurationRequest,
} from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesySesConfigurationRetrieve = (
  options?: SecondParameter<typeof customAxiosInstance<SESConfiguration>>,
) => {
  return customAxiosInstance<SESConfiguration>(
    { url: `/sesy/ses-configuration/`, method: "GET" },
    options,
  );
};
export const sesySesConfigurationUpdate = (
  sESConfigurationRequest: SESConfigurationRequest,
  options?: SecondParameter<typeof customAxiosInstance<SESConfiguration>>,
) => {
  return customAxiosInstance<SESConfiguration>(
    {
      url: `/sesy/ses-configuration/`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: sESConfigurationRequest,
    },
    options,
  );
};
export const sesySesConfigurationDestroy = (
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/ses-configuration/`, method: "DELETE" },
    options,
  );
};
export const sesySesConfigurationCheckProductionStatusCreate = (
  options?: SecondParameter<typeof customAxiosInstance<SESConfiguration>>,
) => {
  return customAxiosInstance<SESConfiguration>(
    { url: `/sesy/ses-configuration/check-production-status/`, method: "POST" },
    options,
  );
};
export type SesySesConfigurationRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesySesConfigurationRetrieve>>
>;
export type SesySesConfigurationUpdateResult = NonNullable<
  Awaited<ReturnType<typeof sesySesConfigurationUpdate>>
>;
export type SesySesConfigurationDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesySesConfigurationDestroy>>
>;
export type SesySesConfigurationCheckProductionStatusCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesySesConfigurationCheckProductionStatusCreate>>
>;
