/**
 * Fetch wrapper that adds Authorization header with stored token.
 * Falls back to regular fetch if no token exists.
 */
export async function fetchWithAuth(url, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, clear token and redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  return response;
}
