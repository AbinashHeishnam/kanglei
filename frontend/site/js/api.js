(function () {
  const API_ORIGIN = "https://kanglei.onrender.com";
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
    const headers = { Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    if (auth) Object.assign(headers, authHeader());

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await res.text();

    if (!res.ok) {
      try {
        const j = JSON.parse(text);
        throw new Error(j.detail || `HTTP ${res.status}`);
      } catch {
        throw new Error(text || `HTTP ${res.status}`);
      }
    }

    return text ? JSON.parse(text) : null;
  }

  window.API_ORIGIN = API_ORIGIN;
  window.API_BASE = API_BASE;
  window.toAssetUrl = toAssetUrl;

  window.apiGet = (e, a=false) => apiRequest(e, "GET", null, a);
  window.apiPost = (e, b, a=false) => apiRequest(e, "POST", b, a);
  window.apiPatch = (e, b, a=true) => apiRequest(e, "PATCH", b, a);
  window.apiDelete = (e, a=true) => apiRequest(e, "DELETE", null, a);
})();
