// @ts-nocheck
import type {
  DetailResponse,
  LoginRequest,
  PasswordChangeRequest,
  User,
  UserUpdateRequest,
} from "../djangoAPI.schemas";

import { customAxiosInstance } from "../../axios";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const authLoginCreate = (
  loginRequest: LoginRequest,
  options?: SecondParameter<typeof customAxiosInstance<User>>,
) => {
  return customAxiosInstance<User>(
    {
      url: `/auth/login/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: loginRequest,
    },
    options,
  );
};
export const authLogoutCreate = (
  options?: SecondParameter<typeof customAxiosInstance<void>>,
) => {
  return customAxiosInstance<void>(
    { url: `/auth/logout/`, method: "POST" },
    options,
  );
};
export const authMeRetrieve = (
  options?: SecondParameter<typeof customAxiosInstance<User>>,
) => {
  return customAxiosInstance<User>(
    { url: `/auth/me/`, method: "GET" },
    options,
  );
};
export const authMeUpdate = (
  userUpdateRequest: UserUpdateRequest,
  options?: SecondParameter<typeof customAxiosInstance<User>>,
) => {
  return customAxiosInstance<User>(
    {
      url: `/auth/me/`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: userUpdateRequest,
    },
    options,
  );
};
export const authPasswordChangeCreate = (
  passwordChangeRequest: PasswordChangeRequest,
  options?: SecondParameter<typeof customAxiosInstance<DetailResponse>>,
) => {
  return customAxiosInstance<DetailResponse>(
    {
      url: `/auth/password-change/`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: passwordChangeRequest,
    },
    options,
  );
};
export type AuthLoginCreateResult = NonNullable<
  Awaited<ReturnType<typeof authLoginCreate>>
>;
export type AuthLogoutCreateResult = NonNullable<
  Awaited<ReturnType<typeof authLogoutCreate>>
>;
export type AuthMeRetrieveResult = NonNullable<
  Awaited<ReturnType<typeof authMeRetrieve>>
>;
export type AuthMeUpdateResult = NonNullable<
  Awaited<ReturnType<typeof authMeUpdate>>
>;
export type AuthPasswordChangeCreateResult = NonNullable<
  Awaited<ReturnType<typeof authPasswordChangeCreate>>
>;
