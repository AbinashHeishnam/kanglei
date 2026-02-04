// frontend/site/js/api.js

const isLocal =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

// ✅ Put your Render backend base here (NO trailing slash)
const PROD_API_ORIGIN = "https://kanglei.onrender.com";

// ✅ API base used for all REST calls
export const API_BASE = isLocal
  ? "http://127.0.0.1:8000/api/v1"
  : `${PROD_API_ORIGIN}/api/v1`;

// ✅ Origin used for building absolute URLs for uploaded assets
export const API_ORIGIN = isLocal
  ? "http://127.0.0.1:8000"
  : PROD_API_ORIGIN;

export function toAssetUrl(path) {
  if (!path) return "https://via.placeholder.com/400x300?text=No+Image";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_ORIGIN}/${cleanPath}`;
}

export function authHeader() {
  const token = localStorage.getItem("kanglei_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic Fetch Wrapper
async function apiRequest(endpoint, method = "GET", body = null, isJson = true, auth = false) {
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  headers["Accept"] = "application/json";

  if (auth) Object.assign(headers, authHeader());

  const config = { method, headers };

  if (body) {
    config.body = isJson ? JSON.stringify(body) : body;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // Auth Error Handling
    if (response.status === 401 && auth) {
      console.warn("Unauthorized access. Clearing token and redirecting.");
      localStorage.removeItem("kanglei_admin_token");

      // ✅ More reliable redirect (works from /admin/* pages)
      if (!window.location.pathname.includes("login.html")) {
        const base = window.location.pathname.includes("/admin/") ? "/admin/" : "/";
        window.location.href = `${base}login.html`;
      }

      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;

      try {
        const errData = await response.json();
        if (errData.detail) errorMsg = errData.detail;
      } catch (e) {
        const text = await response.text();
        if (text) errorMsg += ` - ${text.substring(0, 120)}`;
      }

      throw new Error(errorMsg);
    }

    // Some DELETE endpoints might return empty response
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    return await response.json();
  } catch (err) {
    throw err;
  }
}

export async function apiGet(endpoint, auth = false) {
  return apiRequest(endpoint, "GET", null, true, auth);
}

export async function apiPost(endpoint, body, auth = false) {
  return apiRequest(endpoint, "POST", body, true, auth);
}

export async function apiPatch(endpoint, body, auth = true) {
  return apiRequest(endpoint, "PATCH", body, true, auth);
}

export async function apiDelete(endpoint, auth = true) {
  return apiRequest(endpoint, "DELETE", null, false, auth);
}

export async function apiPostForm(endpoint, formData, auth = true) {
  const headers = { Accept: "application/json" };
  if (auth) Object.assign(headers, authHeader());

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem("kanglei_admin_token");
    if (!window.location.pathname.includes("login.html")) {
      const base = window.location.pathname.includes("/admin/") ? "/admin/" : "/";
      window.location.href = `${base}login.html`;
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
