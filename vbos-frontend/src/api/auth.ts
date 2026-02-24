import type { AuthUser } from "@/store/auth-store";

const API_HOST = import.meta.env.VITE_API_HOST;

export async function login(
  username: string,
  password: string
): Promise<{ token: string }> {
  const response = await fetch(`${API_HOST}/api-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let message = "Invalid username or password";
    try {
      const data = await response.json();
      message = data.non_field_errors?.[0] ?? data.detail ?? message;
    } catch {
      // Response was not JSON, use default message
    }
    throw new Error(String(message));
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_HOST}/api/v1/users/me/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Failed to fetch user");
  }

  return response.json();
}
