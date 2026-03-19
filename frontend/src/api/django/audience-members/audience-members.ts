// @ts-nocheck
import type {
  AudienceMember,
  AudienceMemberCsvUploadRequest,
  AudienceMemberRequest,
  PaginatedAudienceMemberList,
  SesyProjectsMembersListParams,
  SesyProjectsMembersUploadCsvCreate200,
} from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyProjectsMembersList = (
  projectPk: string,
  params?: SesyProjectsMembersListParams,
  options?: SecondParameter<
    typeof customAxiosInstance<PaginatedAudienceMemberList>
  >,
) => {
  return customAxiosInstance<PaginatedAudienceMemberList>(
    { url: `/sesy/projects/${projectPk}/members/`, method: "GET", params },
    options,
  );
};
export const sesyProjectsMembersCreate = (
  projectPk: string,
  audienceMemberRequest: AudienceMemberRequest,
  options?: SecondParameter<typeof customAxiosInstance<AudienceMember>>,
) => {
  return customAxiosInstance<AudienceMember>(
    {
      url: `/sesy/projects/${projectPk}/members/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: audienceMemberRequest,
    },
    options,
  );
};
export const sesyProjectsMembersRetrieve = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<AudienceMember>>,
) => {
  return customAxiosInstance<AudienceMember>(
    { url: `/sesy/projects/${projectPk}/members/${id}/`, method: "GET" },
    options,
  );
};
export const sesyProjectsMembersUpdate = (
  projectPk: string,
  id: string,
  audienceMemberRequest: AudienceMemberRequest,
  options?: SecondParameter<typeof customAxiosInstance<AudienceMember>>,
) => {
  return customAxiosInstance<AudienceMember>(
    {
      url: `/sesy/projects/${projectPk}/members/${id}/`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: audienceMemberRequest,
    },
    options,
  );
};
export const sesyProjectsMembersDestroy = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/projects/${projectPk}/members/${id}/`, method: "DELETE" },
    options,
  );
};
export const sesyProjectsMembersUploadCsvCreate = (
  projectPk: string,
  audienceMemberCsvUploadRequest: AudienceMemberCsvUploadRequest,
  options?: SecondParameter<
    typeof customAxiosInstance<SesyProjectsMembersUploadCsvCreate200>
  >,
) => {
  const formData = new FormData();
  formData.append(`file`, audienceMemberCsvUploadRequest.file);

  return customAxiosInstance<SesyProjectsMembersUploadCsvCreate200>(
    {
      url: `/sesy/projects/${projectPk}/members/upload-csv/`,
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      data: formData,
    },
    options,
  );
};
export type SesyProjectsMembersListResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsMembersList>>
>;
export type SesyProjectsMembersCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsMembersCreate>>
>;
export type SesyProjectsMembersRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsMembersRetrieve>>
>;
export type SesyProjectsMembersUpdateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsMembersUpdate>>
>;
export type SesyProjectsMembersDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsMembersDestroy>>
>;
export type SesyProjectsMembersUploadCsvCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsMembersUploadCsvCreate>>
>;
