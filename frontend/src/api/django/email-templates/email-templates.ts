// @ts-nocheck
import type { EmailTemplate, EmailTemplateRequest } from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyProjectsTemplatesList = (
  projectPk: string,
  options?: SecondParameter<typeof customAxiosInstance<EmailTemplate[]>>,
) => {
  return customAxiosInstance<EmailTemplate[]>(
    { url: `/sesy/projects/${projectPk}/templates/`, method: "GET" },
    options,
  );
};
export const sesyProjectsTemplatesCreate = (
  projectPk: string,
  emailTemplateRequest: EmailTemplateRequest,
  options?: SecondParameter<typeof customAxiosInstance<EmailTemplate>>,
) => {
  return customAxiosInstance<EmailTemplate>(
    {
      url: `/sesy/projects/${projectPk}/templates/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: emailTemplateRequest,
    },
    options,
  );
};
export const sesyProjectsTemplatesRetrieve = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<EmailTemplate>>,
) => {
  return customAxiosInstance<EmailTemplate>(
    { url: `/sesy/projects/${projectPk}/templates/${id}/`, method: "GET" },
    options,
  );
};
export const sesyProjectsTemplatesUpdate = (
  projectPk: string,
  id: string,
  emailTemplateRequest: EmailTemplateRequest,
  options?: SecondParameter<typeof customAxiosInstance<EmailTemplate>>,
) => {
  return customAxiosInstance<EmailTemplate>(
    {
      url: `/sesy/projects/${projectPk}/templates/${id}/`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: emailTemplateRequest,
    },
    options,
  );
};
export const sesyProjectsTemplatesDestroy = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/projects/${projectPk}/templates/${id}/`, method: "DELETE" },
    options,
  );
};
export type SesyProjectsTemplatesListResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTemplatesList>>
>;
export type SesyProjectsTemplatesCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTemplatesCreate>>
>;
export type SesyProjectsTemplatesRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTemplatesRetrieve>>
>;
export type SesyProjectsTemplatesUpdateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTemplatesUpdate>>
>;
export type SesyProjectsTemplatesDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsTemplatesDestroy>>
>;
