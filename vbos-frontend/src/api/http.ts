import { useAuthStore } from "@/store/auth-store";
import { DeviceOfflineError } from "@/errors";
import { toast } from "@/utils/toast";

enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

type RequestPayload = Record<string, unknown>;

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  return headers;
}

function request(
  url: string,
  method: HttpMethod,
  payload?: RequestPayload,
): Promise<Response> {
  return fetch(`${import.meta.env.VITE_API_HOST}${url}`, {
    method,
    headers: getAuthHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  }).then((response) => {
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
      toast.warning("Session expired", "Please sign in again.");
    }
    if (response.status === 599) {
      toast.error("You're offline", "Please check your connection and try again.");
      throw new DeviceOfflineError();
    }
    return response;
  });
}

export function get(url: string): Promise<Response> {
  return request(url, HttpMethod.GET);
}

export function post(url: string, payload: RequestPayload): Promise<Response> {
  return request(url, HttpMethod.POST, payload);
}

export function patch(url: string, payload: RequestPayload): Promise<Response> {
  return request(url, HttpMethod.PATCH, payload);
}

export function _delete(url: string): Promise<Response> {
  return request(url, HttpMethod.DELETE);
}
