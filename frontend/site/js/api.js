const IS_LOCAL =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

export const API_ORIGIN = IS_LOCAL
  ? "http://127.0.0.1:8000"
  : "https://kanglei.onrender.com"; // Render backend

export const API_BASE = `${API_ORIGIN}/api/v1`;

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

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isJson ? JSON.stringify(body) : body;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401 && auth) {
    localStorage.removeItem("kanglei_admin_token");
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "./login.html";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let errorMsg = `HTTP error! status: ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.detail) errorMsg = errData.detail;
    } catch {
      const text = await response.text();
      if (text) errorMsg += ` - ${text.substring(0, 80)}`;
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}

export const apiGet = (endpoint, auth = false) =>
  apiRequest(endpoint, "GET", null, true, auth);

export const apiPost = (endpoint, body, auth = false) =>
  apiRequest(endpoint, "POST", body, true, auth);

export const apiPatch = (endpoint, body, auth = true) =>
  apiRequest(endpoint, "PATCH", body, true, auth);

export const apiDelete = (endpoint, auth = true) =>
  apiRequest(endpoint, "DELETE", null, false, auth);

export async function apiPostForm(endpoint, formData, auth = true) {
  const headers = { Accept: "application/json" };
  if (auth) Object.assign(headers, authHeader());

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem("kanglei_admin_token");
    window.location.href = "./login.html";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
