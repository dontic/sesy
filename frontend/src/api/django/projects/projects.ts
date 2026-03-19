// @ts-nocheck
import type { Project, ProjectRequest } from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyProjectsList = (
  options?: SecondParameter<typeof customAxiosInstance<Project[]>>,
) => {
  return customAxiosInstance<Project[]>(
    { url: `/sesy/projects/`, method: "GET" },
    options,
  );
};
export const sesyProjectsCreate = (
  projectRequest: ProjectRequest,
  options?: SecondParameter<typeof customAxiosInstance<Project>>,
) => {
  return customAxiosInstance<Project>(
    {
      url: `/sesy/projects/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: projectRequest,
    },
    options,
  );
};
export const sesyProjectsRetrieve = (
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<Project>>,
) => {
  return customAxiosInstance<Project>(
    { url: `/sesy/projects/${id}/`, method: "GET" },
    options,
  );
};
export const sesyProjectsUpdate = (
  id: string,
  projectRequest: ProjectRequest,
  options?: SecondParameter<typeof customAxiosInstance<Project>>,
) => {
  return customAxiosInstance<Project>(
    {
      url: `/sesy/projects/${id}/`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: projectRequest,
    },
    options,
  );
};
export const sesyProjectsDestroy = (
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/projects/${id}/`, method: "DELETE" },
    options,
  );
};
export type SesyProjectsListResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsList>>
>;
export type SesyProjectsCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsCreate>>
>;
export type SesyProjectsRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsRetrieve>>
>;
export type SesyProjectsUpdateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsUpdate>>
>;
export type SesyProjectsDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsDestroy>>
>;
