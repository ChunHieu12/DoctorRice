import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// Constants
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TOKEN_KEY = "accessToken";
const DEFAULT_API_URL = "https://doctorrice-xdhp.onrender.com/api";

type ExpoExtraConfig = {
  apiUrl?: string;
  [key: string]: any;
};

const resolveExpoExtra = (): ExpoExtraConfig | undefined => {
  if (Constants.expoConfig?.extra) {
    return Constants.expoConfig.extra;
  }

  const legacyManifest = (Constants as any)?.manifest;
  if (legacyManifest?.extra) {
    return legacyManifest.extra;
  }

  const manifest2 = (Constants as any)?.manifest2;
  if (manifest2?.extra) {
    return manifest2.extra;
  }

  return undefined;
};

let cachedApiUrl: string | null = null;

/**
 * Get API base URL from app.json extra config
 * Priority: 1. app.json extra.apiUrl, 2. env vars, 3. default production URL
 */
const getApiUrl = (): string => {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }

  const extraConfig = resolveExpoExtra();
  const configUrl = extraConfig?.apiUrl;

  if (configUrl) {
    console.log("📡 API URL from app config:", configUrl);
    cachedApiUrl = configUrl;
    return configUrl;
  }

  // Fallback to env vars (for development override)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log("📡 API URL from env:", process.env.EXPO_PUBLIC_API_URL);
    cachedApiUrl = process.env.EXPO_PUBLIC_API_URL;
    return cachedApiUrl;
  }

  // Final fallback
  console.log("📡 API URL (default):", DEFAULT_API_URL);
  cachedApiUrl = DEFAULT_API_URL;
  return cachedApiUrl;
};

/**
 * API Response interface
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Create axios instance with base configuration
 */
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: getApiUrl(),
    timeout: API_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    async (config) => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn("Failed to get access token:", error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Only log errors, not all requests
      if (error.response) {
        console.error(
          `❌ API Error: ${error.config?.method?.toUpperCase()} ${
            error.config?.url
          } - Status: ${error.response.status}`
        );
      } else {
        console.error(
          `❌ Network Error: ${error.config?.method?.toUpperCase()} ${
            error.config?.url
          } - ${error.message}`
        );
      }

      const config = error.config as AxiosRequestConfig & {
        _retry?: boolean;
        _retryCount?: number;
      };

      // Handle network errors with retry logic
      if (!error.response && config && !config._retry) {
        config._retryCount = config._retryCount || 0;

        if (config._retryCount < MAX_RETRIES) {
          config._retryCount += 1;

          // Exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);

          console.log(
            `Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms...`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));

          return instance(config);
        }
      }

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && config && !config._retry) {
        config._retry = true;

        try {
          // Try to refresh token
          const refreshed = await refreshAccessToken();

          if (refreshed) {
            // Retry original request with new token
            return instance(config);
          }
        } catch (refreshError) {
          // Refresh failed - redirect to login
          console.error("Token refresh failed:", refreshError);
          // TODO: Trigger logout/redirect to login
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");

    if (!refreshToken) {
      return false;
    }

    const response = await axios.post(`${getApiUrl()}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    // Save new tokens
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync("refreshToken", newRefreshToken);
    }

    return true;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return false;
  }
};

/**
 * Save authentication tokens
 */
export const saveTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
  } catch (error) {
    console.error("Failed to save tokens:", error);
    throw error;
  }
};

/**
 * Clear authentication tokens
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync("refreshToken");
  } catch (error) {
    console.error("Failed to clear tokens:", error);
  }
};

/**
 * Get access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
};

// Create the API instance
const api = createApiInstance();

/**
 * API Helper functions
 */

export const apiGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await api.get(url, config);
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
};

export const apiPost = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await api.post(
      url,
      data,
      config
    );
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
};

export const apiPut = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await api.put(
      url,
      data,
      config
    );
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
};

export const apiDelete = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await api.delete(
      url,
      config
    );
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
};

/**
 * Upload file with multipart/form-data
 */
export const apiUpload = async <T = any>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await api.post(
      url,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
};

/**
 * Handle API errors and return standardized response
 */
const handleApiError = (error: AxiosError): ApiResponse => {
  if (error.response) {
    // Server responded with error
    const data = error.response.data as any;
    return {
      success: false,
      error: {
        code: data?.error?.code || `HTTP_${error.response.status}`,
        message: data?.error?.message || error.message,
        details: data?.error?.details,
      },
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message:
          "Network connection error. Please check your internet connection.",
      },
    };
  } else {
    // Error in request setup
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error.message || "An unknown error occurred",
      },
    };
  }
};

/**
 * Create cancel token source for request cancellation
 */
export const createCancelToken = () => axios.CancelToken.source();

/**
 * Check if error is a cancel error
 */
export const isCancelError = (error: any) => axios.isCancel(error);

// Export the API instance as default
export default api;
