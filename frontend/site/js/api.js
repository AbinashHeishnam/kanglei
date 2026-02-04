const IS_LOCAL =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

// CHANGE THIS TO YOUR REAL RENDER URL
const RENDER_API = "https://kanglei.onrender.com";

export const API_ORIGIN = IS_LOCAL
  ? "http://127.0.0.1:8000"
  : RENDER_API;

export const API_BASE = API_ORIGIN + "/api/v1";

// ---------------- AUTH ----------------
export function authHeader() {
  const token = localStorage.getItem("kanglei_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------- CORE REQUEST ----------------
async function apiRequest(endpoint, method = "GET", body = null, isJson = true, auth = false) {
  const headers = { Accept: "application/json" };

  if (isJson) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, authHeader());

  const config = { method, headers };
  if (body) config.body = isJson ? JSON.stringify(body) : body;

  const res = await fetch(API_BASE + endpoint, config);

  if (res.status === 401) {
    localStorage.removeItem("kanglei_admin_token");
    window.location.href = "./login.html";
    throw new Error("Unauthorized");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

// ---------------- HELPERS ----------------
export const apiGet = (e, auth = false) => apiRequest(e, "GET", null, true, auth);
export const apiPost = (e, b, auth = false) => apiRequest(e, "POST", b, true, auth);
export const apiPatch = (e, b, auth = true) => apiRequest(e, "PATCH", b, true, auth);
export const apiDelete = (e, auth = true) => apiRequest(e, "DELETE", null, false, auth);

export async function apiPostForm(endpoint, formData, auth = true) {
  const headers = { Accept: "application/json" };
  if (auth) Object.assign(headers, authHeader());

  const res = await fetch(API_BASE + endpoint, {
    method: "POST",
    headers,
    body: formData
  });

  if (!res.ok) throw new Error("Upload failed");
  return await res.json();
}

// ---------------- ASSETS ----------------
export function toAssetUrl(path) {
  if (!path) return "https://via.placeholder.com/400x300?text=No+Image";
  if (path.startsWith("http")) return path;
  return API_ORIGIN + "/" + path.replace(/^\/+/, "");
}
