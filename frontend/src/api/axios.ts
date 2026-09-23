// Custom instance of axios

import axios from "axios";
import type { AxiosRequestConfig } from "axios";

const baseURL = import.meta.env.DEV ? "http://localhost:8000" : "/api";

export const customAxios = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken"
});

// Users with a temporary password are blocked by the API until they change it,
// so send them to the password change page if any request gets rejected for that reason
customAxios.interceptors.response.use(undefined, (error) => {
  if (
    error.response?.status === 403 &&
    error.response.data?.code === "password_change_required" &&
    window.location.pathname !== "/change-password"
  ) {
    window.location.assign("/change-password");
  }
  return Promise.reject(error);
});

export const customAxiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = customAxios({
    ...config,
    ...options,
    paramsSerializer: {
      indexes: null
    },
    cancelToken: source.token
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};
