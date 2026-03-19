// @ts-nocheck
import type {
  VerifiedDomain,
  VerifiedDomainRequest,
} from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyProjectsDomainRetrieve = (
  projectPk: number,
  options?: SecondParameter<typeof customAxiosInstance<VerifiedDomain>>,
) => {
  return customAxiosInstance<VerifiedDomain>(
    { url: `/sesy/projects/${projectPk}/domain/`, method: "GET" },
    options,
  );
};
export const sesyProjectsDomainCreate = (
  projectPk: number,
  verifiedDomainRequest: VerifiedDomainRequest,
  options?: SecondParameter<typeof customAxiosInstance<VerifiedDomain>>,
) => {
  return customAxiosInstance<VerifiedDomain>(
    {
      url: `/sesy/projects/${projectPk}/domain/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: verifiedDomainRequest,
    },
    options,
  );
};
export const sesyProjectsDomainDestroy = (
  projectPk: number,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/projects/${projectPk}/domain/`, method: "DELETE" },
    options,
  );
};
export type SesyProjectsDomainRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsDomainRetrieve>>
>;
export type SesyProjectsDomainCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsDomainCreate>>
>;
export type SesyProjectsDomainDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsDomainDestroy>>
>;
