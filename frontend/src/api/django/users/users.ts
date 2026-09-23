// @ts-nocheck
import type {
  PatchedUserManagementUpdateRequest,
  TempPassword,
  UserCreated,
  UserManagement,
  UserManagementRequest
} from '../djangoAPI.schemas';

import { customAxiosInstance } from '../../axios';


type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];


  /**
 * List all users.
 */
export const authUsersList = (

 options?: SecondParameter<typeof customAxiosInstance<UserManagement[]>>,) => {
      return customAxiosInstance<UserManagement[]>(
      {url: `/auth/users/`, method: 'GET'
    },
      options);
    }
  /**
 * Create a user with a temporary password they must change on first login.
 */
export const authUsersCreate = (
    userManagementRequest: UserManagementRequest,
 options?: SecondParameter<typeof customAxiosInstance<UserCreated>>,) => {
      return customAxiosInstance<UserCreated>(
      {url: `/auth/users/`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: userManagementRequest
    },
      options);
    }
  /**
 * Retrieve a user.
 */
export const authUsersRetrieve = (
    id: number,
 options?: SecondParameter<typeof customAxiosInstance<UserManagement>>,) => {
      return customAxiosInstance<UserManagement>(
      {url: `/auth/users/${id}/`, method: 'GET'
    },
      options);
    }
  /**
 * Update a user's name or role. The owner cannot be modified here.
 */
export const authUsersPartialUpdate = (
    id: number,
    patchedUserManagementUpdateRequest?: PatchedUserManagementUpdateRequest,
 options?: SecondParameter<typeof customAxiosInstance<UserManagement>>,) => {
      return customAxiosInstance<UserManagement>(
      {url: `/auth/users/${id}/`, method: 'PATCH',
      headers: {'Content-Type': 'application/json', },
      data: patchedUserManagementUpdateRequest
    },
      options);
    }
  /**
 * Delete a user. Their projects and API keys are reassigned to the requesting user.
 */
export const authUsersDestroy = (
    id: number,
 options?: SecondParameter<typeof customAxiosInstance<void>>,) => {
      return customAxiosInstance<void>(
      {url: `/auth/users/${id}/`, method: 'DELETE'
    },
      options);
    }
  /**
 * Generate a new temporary password. The user must change it on next login.
 */
export const authUsersResetPasswordCreate = (
    id: number,
 options?: SecondParameter<typeof customAxiosInstance<TempPassword>>,) => {
      return customAxiosInstance<TempPassword>(
      {url: `/auth/users/${id}/reset-password/`, method: 'POST'
    },
      options);
    }
  /**
 * Make this user the owner. The current owner is downgraded to admin.
 */
export const authUsersTransferOwnershipCreate = (
    id: number,
 options?: SecondParameter<typeof customAxiosInstance<UserManagement>>,) => {
      return customAxiosInstance<UserManagement>(
      {url: `/auth/users/${id}/transfer-ownership/`, method: 'POST'
    },
      options);
    }
  export type AuthUsersListResult = NonNullable<Awaited<ReturnType<typeof authUsersList>>>
export type AuthUsersCreateResult = NonNullable<Awaited<ReturnType<typeof authUsersCreate>>>
export type AuthUsersRetrieveResult = NonNullable<Awaited<ReturnType<typeof authUsersRetrieve>>>
export type AuthUsersPartialUpdateResult = NonNullable<Awaited<ReturnType<typeof authUsersPartialUpdate>>>
export type AuthUsersDestroyResult = NonNullable<Awaited<ReturnType<typeof authUsersDestroy>>>
export type AuthUsersResetPasswordCreateResult = NonNullable<Awaited<ReturnType<typeof authUsersResetPasswordCreate>>>
export type AuthUsersTransferOwnershipCreateResult = NonNullable<Awaited<ReturnType<typeof authUsersTransferOwnershipCreate>>>
