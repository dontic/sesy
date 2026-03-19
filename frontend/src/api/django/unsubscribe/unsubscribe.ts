// @ts-nocheck
import type { UnsubscribeRequest } from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const sesyProjectsUnsubscribeCreate = (
  projectPk: number,
  unsubscribeRequest: UnsubscribeRequest,
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    {
      url: `/sesy/projects/${projectPk}/unsubscribe/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: unsubscribeRequest,
    },
    options,
  );
};
export type SesyProjectsUnsubscribeCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyProjectsUnsubscribeCreate>>
>;
