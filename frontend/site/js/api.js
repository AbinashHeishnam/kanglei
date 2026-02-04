/**
 * GLOBAL API CONFIG (works with normal <script> tags)
 * - Dev: localhost backend
 * - Prod: Render backend
 */

(function () {
  const IS_LOCAL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  const API_ORIGIN = IS_LOCAL
    ? "http://127.0.0.1:8000"
    : "https://kanglei.onrender.com";

  const API_BASE = API_ORIGIN + "/api/v1";

  function authHeader() {
    const token = localStorage.getItem("kanglei_admin_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function toAssetUrl(path) {
    if (!path) return "https://via.placeholder.com/400x300?text=No+Image";
    if (path.startsWith("http")) return path;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${API_ORIGIN}/${clean}`;
  }

  async function apiRequest(endpoint, method = "GET", body = null, auth = false, isJson = true) {
    const headers = { Accept: "application/json" };
    if (isJson) headers["Content-Type"] = "application/json";
    if (auth) Object.assign(headers, authHeader());

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? (isJson ? JSON.stringify(body) : body) : undefined,
    });

    // read ONCE (fixes "body stream already read")
    const text = await res.text();

    if (res.status === 401 && auth) {
      localStorage.removeItem("kanglei_admin_token");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      // try parse json error
      try {
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.detail || `HTTP ${res.status}`);
      } catch {
        throw new Error(text || `HTTP ${res.status}`);
      }
    }

    // parse json
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  }

  async function apiPostForm(endpoint, formData, auth = true) {
    const headers = { Accept: "application/json" };
    if (auth) Object.assign(headers, authHeader());

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const text = await res.text();

    if (res.status === 401 && auth) {
      localStorage.removeItem("kanglei_admin_token");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      throw new Error(text || `HTTP ${res.status}`);
    }

    return text ? JSON.parse(text) : null;
  }

  // expose globals (so admin.js can use them)
  window.API_ORIGIN = API_ORIGIN;
  window.API_BASE = API_BASE;
  window.toAssetUrl = toAssetUrl;
  window.authHeader = authHeader;

  window.apiGet = (endpoint, auth = false) => apiRequest(endpoint, "GET", null, auth, true);
  window.apiPost = (endpoint, body, auth = false) => apiRequest(endpoint, "POST", body, auth, true);
  window.apiPatch = (endpoint, body, auth = true) => apiRequest(endpoint, "PATCH", body, auth, true);
  window.apiDelete = (endpoint, auth = true) => apiRequest(endpoint, "DELETE", null, auth, false);
  window.apiPostForm = apiPostForm;
})();
