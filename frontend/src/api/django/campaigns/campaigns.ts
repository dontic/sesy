// @ts-nocheck
import type { Campaign, CampaignRequest } from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyProjectsCampaignsList = (
  projectPk: string,
  options?: SecondParameter<typeof customAxiosInstance<Campaign[]>>,
) => {
  return customAxiosInstance<Campaign[]>(
    { url: `/sesy/projects/${projectPk}/campaigns/`, method: "GET" },
    options,
  );
};
export const sesyProjectsCampaignsCreate = (
  projectPk: string,
  campaignRequest: CampaignRequest,
  options?: SecondParameter<typeof customAxiosInstance<Campaign>>,
) => {
  return customAxiosInstance<Campaign>(
    {
      url: `/sesy/projects/${projectPk}/campaigns/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: campaignRequest,
    },
    options,
  );
};
export const sesyProjectsCampaignsRetrieve = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<Campaign>>,
) => {
  return customAxiosInstance<Campaign>(
    { url: `/sesy/projects/${projectPk}/campaigns/${id}/`, method: "GET" },
    options,
  );
};
export const sesyProjectsCampaignsUpdate = (
  projectPk: string,
  id: string,
  campaignRequest: CampaignRequest,
  options?: SecondParameter<typeof customAxiosInstance<Campaign>>,
) => {
  return customAxiosInstance<Campaign>(
    {
      url: `/sesy/projects/${projectPk}/campaigns/${id}/`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: campaignRequest,
    },
    options,
  );
};
export const sesyProjectsCampaignsDestroy = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/sesy/projects/${projectPk}/campaigns/${id}/`, method: "DELETE" },
    options,
  );
};
export const sesyProjectsCampaignsSendCreate = (
  projectPk: string,
  id: string,
  options?: SecondParameter<typeof customAxiosInstance<Campaign>>,
) => {
  return customAxiosInstance<Campaign>(
    {
      url: `/sesy/projects/${projectPk}/campaigns/${id}/send/`,
      method: "POST",
    },
    options,
  );
};
export type SesyProjectsCampaignsListResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsCampaignsList>>
>;
export type SesyProjectsCampaignsCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsCampaignsCreate>>
>;
export type SesyProjectsCampaignsRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsCampaignsRetrieve>>
>;
export type SesyProjectsCampaignsUpdateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsCampaignsUpdate>>
>;
export type SesyProjectsCampaignsDestroyResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsCampaignsDestroy>>
>;
export type SesyProjectsCampaignsSendCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsCampaignsSendCreate>>
>;
