import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { auth } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://getshoot-backend-178777845649.europe-west1.run.app/api";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class BaseApiClient {
  protected client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      const token = auth.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response) {
          console.log(error.response);
          // Server responded with error status
          return Promise.reject({
            error:
              error.response.data?.message ||
              error.response.data?.error ||
              "An error occurred",
            status: error.response.status,
          });
        } else if (error.request) {
          // Network error
          return Promise.reject({
            error: "Network error occurred",
          });
        } else {
          // Other error
          return Promise.reject({
            error: "An unexpected error occurred",
          });
        }
      }
    );
  }

  protected async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
        ...config,
      });

      return { data: response.data };
    } catch (error: unknown) {
      if (error && typeof error === "object" && "error" in error) {
        const errObj = error as { error?: string };
        return { error: errObj.error ?? "An error occurred" };
      }
      return { error: "An error occurred" };
    }
  }

  protected async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, config);
  }

  protected async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, data, config);
  }

  protected async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, data, config);
  }

  protected async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, config);
  }
}

export { BaseApiClient };
export type { ApiResponse };
export const apiClient = new BaseApiClient();
