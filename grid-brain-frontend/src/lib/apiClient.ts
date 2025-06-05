import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ApiClientOptions extends RequestInit {
  includeAuthToken?: boolean;
}

async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { includeAuthToken = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (includeAuthToken) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
  }

  if (
    !headers.has("Content-Type") &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.append("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, use status text
      errorData = { detail: response.statusText || "Request failed" };
    }
    // TODO: Handle 401/403 globally for logout/redirect if needed
    // For example, by checking response.status and calling useAuthStore.getState().logout()
    // This would require this apiClient to be more integrated or have access to router if redirecting.
    // For now, it just throws an error to be caught by the calling code.
    if (response.status === 401 && includeAuthToken) {
      // Token might be expired or invalid, attempt to logout user from store
      // Check if it's not a login attempt itself causing 401
      if (!endpoint.includes("/auth/token")) {
        useAuthStore.getState().logout();
        // Optionally, redirect to login page here if router is accessible
        // Or throw a specific error that a global error handler can catch for redirection.
      }
    }
    throw new Error(
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }

  // Handle cases where response might be empty (e.g., 204 No Content)
  const contentType = response.headers.get("content-type");
  if (
    response.status === 204 ||
    !contentType ||
    !contentType.includes("application/json")
  ) {
    return {} as T; // Or null, or handle as appropriate for your app
  }

  return response.json() as Promise<T>;
}

export default apiClient;

// Example Usage:
// apiClient<{ message: string }>('/some/protected/endpoint')
//   .then(data => console.log(data.message))
//   .catch(error => console.error(error));

// apiClient('/some/public/endpoint', { includeAuthToken: false });

// apiClient('/submit/form', {
//   method: 'POST',
//   body: JSON.stringify({ key: 'value' }),
// });
