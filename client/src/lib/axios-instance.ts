import axios, { AxiosError, AxiosResponse } from "axios";
import { ErrorResponse } from "../types/error-response";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

export const setupAxiosInterceptors = (
  showToast: ({
    title,
    description,
    isDestructive,
  }: {
    title: string;
    description: string;
    isDestructive?: boolean;
  }) => void
) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // console.log(`API URL: ${config.url}`);

      return config;
    },
    (error: AxiosError) => {
      showToast({
        title: "Request Error",
        description: error.message,
        isDestructive: true,
      });
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (response.data.showMessage) {
        showToast({
          title: "Request Success",
          description: response.data.message,
        });
      }

      return response;
    },
    (error: AxiosError<ErrorResponse>) => {
      if (error.response) {
        const errorMessage =
          error.response.data?.message || error.response.statusText;

        showToast({
          title: "Request Error",
          description: errorMessage,
          isDestructive: true,
        });
      } else if (error.request) {
        showToast({
          title: "Network Error",
          description: "Please try again later",
          isDestructive: true,
        });
      } else {
        showToast({
          title: "Request Error",
          description: error.message,
          isDestructive: true,
        });
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
