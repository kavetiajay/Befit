import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Retrieve authorization token from local or session storage
 */
const getToken = (): string | null => {
  return localStorage.getItem("gym_token") || sessionStorage.getItem("gym_token");
};

/**
 * Helper to build common headers
 */
const getHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge custom headers
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  return headers;
};

/**
 * Process the fetch response and handle errors centrally
 */
const handleResponse = async (response: Response): Promise<any> => {
  let data: any = null;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      // ignore JSON parse error
    }
  } else {
    try {
      const text = await response.text();
      data = { message: text };
    } catch {
      // ignore
    }
  }

  if (!response.ok) {
    const status = response.status;
    const message = data?.message || data?.error || `HTTP error! status: ${status}`;

    // Centralized side-effects for specific status codes
    switch (status) {
      case 401:
        // Clear authentication session data
        localStorage.removeItem("gym_auth");
        localStorage.removeItem("gym_role");
        localStorage.removeItem("gym_token");
        localStorage.removeItem("gym_client_id");
        sessionStorage.removeItem("gym_auth");
        sessionStorage.removeItem("gym_role");
        sessionStorage.removeItem("gym_token");
        sessionStorage.removeItem("gym_client_id");

        toast.error(message || "Session expired. Please log in again.");
        // Redirect to login page if we aren't already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        break;

      case 403:
        toast.error(message || "Access denied. You do not have permission to view this content.");
        break;

      case 404:
        toast.error(message || "Requested resource not found.");
        break;

      case 409:
        toast.error(message || "A conflict occurred. Please review your input.");
        break;

      case 400:
      case 422:
        toast.error(message || "Validation failed. Please correct the fields.");
        break;

      case 500:
      default:
        toast.error(message || "A server error occurred. Please try again later.");
        break;
    }

    throw new ApiError(status, message, data);
  }

  return data;
};

/**
 * Execute request using fetch
 */
const request = async <T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: any,
  options?: RequestInit
): Promise<T> => {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = getHeaders(options?.headers);
  const config: RequestInit = {
    ...options,
    method,
    headers,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Likely a network/connection error (TypeError)
    const netErrorMsg = error instanceof Error ? error.message : String(error);
    toast.error(`Network error: ${netErrorMsg || "Could not connect to the backend server."}`);
    throw new ApiError(0, `Network error: ${netErrorMsg}`, { error });
  }
};

/**
 * API client layer
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, "GET", undefined, options),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, "POST", body, options),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, "PATCH", body, options),

  delete: <T = any>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, "DELETE", undefined, options),
};
