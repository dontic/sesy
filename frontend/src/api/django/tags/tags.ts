// @ts-nocheck
import type {
  Tag,
  TagMergeRequestRequest,
  TagRequest,
} from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyProjectsTagsList = (
  projectPk: string,
  options?: SecondParameter<typeof customAxiosInstance<Tag[]>>,
) => {
  return customAxiosInstance<Tag[]>(
    { url: `/sesy/projects/${projectPk}/tags/`, method: "GET" },
    options,
  );
};
export const sesyProjectsTagsCreate = (
  projectPk: string,
  tagRequest: TagRequest,
  options?: SecondParameter<typeof customAxiosInstance<Tag>>,
) => {
  return customAxiosInstance<Tag>(
    {
      url: `/sesy/projects/${projectPk}/tags/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: tagRequest,
    },
    options,
  );
};
export const sesyProjectsTagsRetrieve = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<Tag>>,
) => {
  return customAxiosInstance<Tag>(
    { url: `/sesy/projects/${projectPk}/tags/${id}/`, method: "GET" },
    options,
  );
};
export const sesyProjectsTagsUpdate = (
  projectPk: string,
  id: string,
  tagRequest: TagRequest,
  options?: SecondParameter<typeof customAxiosInstance<Tag>>,
) => {
  return customAxiosInstance<Tag>(
    {
      url: `/sesy/projects/${projectPk}/tags/${id}/`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: tagRequest,
    },
    options,
  );
};
export const sesyProjectsTagsDestroy = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/projects/${projectPk}/tags/${id}/`, method: "DELETE" },
    options,
  );
};
export const sesyProjectsTagsMergeCreate = (
  projectPk: string,
  id: string,
  tagMergeRequestRequest: TagMergeRequestRequest,
  options?: SecondParameter<typeof customAxiosInstance<Tag>>,
) => {
  return customAxiosInstance<Tag>(
    {
      url: `/sesy/projects/${projectPk}/tags/${id}/merge/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: tagMergeRequestRequest,
    },
    options,
  );
};
export type SesyProjectsTagsListResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTagsList>>
>;
export type SesyProjectsTagsCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTagsCreate>>
>;
export type SesyProjectsTagsRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTagsRetrieve>>
>;
export type SesyProjectsTagsUpdateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTagsUpdate>>
>;
export type SesyProjectsTagsDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTagsDestroy>>
>;
export type SesyProjectsTagsMergeCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTagsMergeCreate>>
>;
