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

  async function apiRequest(endpoint, method = "GET", body = null, auth = false) {
    const headers = { Accept: "application/json", "Content-Type": "application/json" };
    if (auth) Object.assign(headers, authHeader());

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // READ ONCE (fixes body stream already read)
    const text = await res.text();

    if (!res.ok) {
      try {
        const j = text ? JSON.parse(text) : null;
        throw new Error(j?.detail || `HTTP ${res.status}`);
      } catch {
        throw new Error(text || `HTTP ${res.status}`);
      }
    }

    return text ? JSON.parse(text) : null;
  }

  window.API_ORIGIN = API_ORIGIN;
  window.API_BASE = API_BASE;

  window.toAssetUrl = toAssetUrl;
  window.apiGet = (e, auth=false) => apiRequest(e, "GET", null, auth);
  window.apiPost = (e, b, auth=false) => apiRequest(e, "POST", b, auth);
  window.apiPatch = (e, b, auth=true) => apiRequest(e, "PATCH", b, auth);
  window.apiDelete = (e, auth=true) => apiRequest(e, "DELETE", null, auth);
})();
