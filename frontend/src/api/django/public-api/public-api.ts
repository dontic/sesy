// @ts-nocheck
import type {
  AudienceMember,
  PublicAudienceMemberRequest,
} from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * Create an audience member in a project. Tags are created automatically if they don't exist.
 */
export const sesyPublicMembersCreate = (
  publicAudienceMemberRequest: PublicAudienceMemberRequest,
  options?: SecondParameter<typeof customAxiosInstance<AudienceMember>>,
) => {
  return customAxiosInstance<AudienceMember>(
    {
      url: `/sesy/public/members/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: publicAudienceMemberRequest,
    },
    options,
  );
};
export type SesyPublicMembersCreateResult = NonNullable<
  Awaited<ReturnType<typeof sesyPublicMembersCreate>>
>;
