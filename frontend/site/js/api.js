// ==============================
// Environment Detection
// ==============================

const isLocal =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

// 👉 Change only when your tunnel changes
const NGROK_ORIGIN = "https://jedidiah-snarly-erlinda.ngrok-free.dev";

// ✅ Add this for Cloudflare tunnel backend URL
const TRYCLOUDFLARE_API_ORIGIN = "https://end-smtp-wells-clothing.trycloudflare.com";
// Detect if frontend is opened from a Cloudflare quick tunnel
const isTryCloudflare = window.location.hostname.endsWith("trycloudflare.com");

export const API_ORIGIN = isLocal
  ? "http://127.0.0.1:8000"
  : (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_ORIGIN)
    ? import.meta.env.VITE_API_ORIGIN
    : isTryCloudflare
      ? TRYCLOUDFLARE_API_ORIGIN
      : NGROK_ORIGIN;

// ==============================
// API Base (/api/v1 always here)
// ==============================

export const API_BASE = `${API_ORIGIN}/api/v1`;

// Debug helper (open DevTools → window.__API_DEBUG__)
window.__API_DEBUG__ = { API_ORIGIN, API_BASE };

// ==============================
// Helpers
// ==============================

function normalizeEndpoint(endpoint) {
  if (!endpoint) return "";
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

export function toAssetUrl(path) {
  if (!path)
    return "https://via.placeholder.com/400x300?text=No+Image";

  if (path.startsWith("http"))
    return path;

  const cleanPath = path.startsWith("/")
    ? path.slice(1)
    : path;

  return `${API_ORIGIN}/${cleanPath}`;
}

export function authHeader() {
  const token = localStorage.getItem("kanglei_admin_token");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

// ==============================
// Core Fetch Wrapper
// ==============================

async function apiRequest(
  endpoint,
  method = "GET",
  body = null,
  isJson = true,
  auth = false
) {
  const url = `${API_BASE}${normalizeEndpoint(endpoint)}`;

  const headers = {
    Accept: "application/json",
  };

  if (isJson)
    headers["Content-Type"] = "application/json";

  if (auth)
    Object.assign(headers, authHeader());

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isJson
      ? JSON.stringify(body)
      : body;
  }

  try {
    const response = await fetch(url, config);

    // ==========================
    // Auth Handling
    // ==========================
    if (response.status === 401 && auth) {
      console.warn("Unauthorized. Clearing token.");

      localStorage.removeItem(
        "kanglei_admin_token"
      );

      if (
        !window.location.pathname.includes(
          "login.html"
        )
      ) {
        window.location.href =
          "./login.html";
      }

      throw new Error("Unauthorized");
    }

    // ==========================
    // Error Handling
    // ==========================
    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;

      try {
        const err = await response.json();
        if (err.detail)
          errorMsg = err.detail;
      } catch {
        const text =
          await response.text();
        if (text)
          errorMsg += ` - ${text.slice(
            0,
            80
          )}`;
      }

      throw new Error(errorMsg);
    }

    // ==========================
    // Success
    // ==========================
    return await response.json();
  } catch (err) {
    console.error(
      "API Error:",
      err.message
    );
    throw err;
  }
}

// ==============================
// Public API Methods
// ==============================

export async function apiGet(
  endpoint,
  auth = false
) {
  return apiRequest(
    endpoint,
    "GET",
    null,
    true,
    auth
  );
}

export async function apiPost(
  endpoint,
  body,
  auth = false
) {
  return apiRequest(
    endpoint,
    "POST",
    body,
    true,
    auth
  );
}

export async function apiPatch(
  endpoint,
  body,
  auth = true
) {
  return apiRequest(
    endpoint,
    "PATCH",
    body,
    true,
    auth
  );
}

export async function apiDelete(
  endpoint,
  auth = true
) {
  return apiRequest(
    endpoint,
    "DELETE",
    null,
    false,
    auth
  );
}

export async function apiPostForm(
  endpoint,
  formData,
  auth = true
) {
  const url = `${API_BASE}${normalizeEndpoint(
    endpoint
  )}`;

  const headers = {
    Accept: "application/json",
  };

  if (auth)
    Object.assign(headers, authHeader());

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem(
      "kanglei_admin_token"
    );

    if (
      !window.location.pathname.includes(
        "login.html"
      )
    ) {
      window.location.href =
        "./login.html";
    }

    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const err =
      await response.json().catch(
        () => ({})
      );

    throw new Error(
      err.detail ||
      `HTTP ${response.status}`
    );
  }

  return await response.json();
}
