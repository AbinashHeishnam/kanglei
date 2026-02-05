// ===== API CONFIG =====

// Detect local vs production
const isLocal =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

// 👉 PASTE YOUR NGROK URL HERE
const NGROK_ORIGIN = " https://jedidiah-snarly-erlinda.ngrok-free.dev";

// Server origin (NO /api/v1 here)
export const API_ORIGIN = isLocal
  ? "http://127.0.0.1:8000"
  : NGROK_ORIGIN;

// API base always includes /api/v1
export const API_BASE = API_ORIGIN + "/api/v1";

// Debug helper
window._API_DEBUG_ = {
  API_ORIGIN: API_ORIGIN,
  API_BASE: API_BASE
};

// Debug Helper
if (typeof window !== 'undefined') {
  window._API_DEBUG_ = { API_ORIGIN, API_BASE, isLocal };
  console.log('API Client Config:', window._API_DEBUG_);
}

export function toAssetUrl(path) {
  if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
  if (path.startsWith('http')) return path;

  // Normalize path to ensure no double slashes if path starts with /
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Asset URLs are relative to ORIGIN, not API_BASE
  // e.g. http://127.0.0.1:8000/uploads/events/foo.jpg
  return `${API_ORIGIN}/${cleanPath}`;
}

export function authHeader() {
  const token = localStorage.getItem('kanglei_admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Generic Fetch Wrapper
async function apiRequest(endpoint, method = 'GET', body = null, isJson = true, auth = false) {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  headers['Accept'] = 'application/json';

  if (auth) Object.assign(headers, authHeader());

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isJson ? JSON.stringify(body) : body;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // Auth Error Handling
    if (response.status === 401 && auth) {
      console.warn('Unauthorized access. Clearing token and redirecting.');
      localStorage.removeItem('kanglei_admin_token');
      // Determine if we are on a page that needs redirect
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = './login.html'; // Relative redirect assumption
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.detail) errorMsg = errData.detail;
      } catch (e) {
        // Ignore json parse error
        const text = await response.text();
        if (text) errorMsg += ` - ${text.substring(0, 50)}`;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
}

export async function apiGet(endpoint, auth = false) {
  return apiRequest(endpoint, 'GET', null, true, auth);
}

export async function apiPost(endpoint, body, auth = false) {
  return apiRequest(endpoint, 'POST', body, true, auth);
}

export async function apiPatch(endpoint, body, auth = true) {
  return apiRequest(endpoint, 'PATCH', body, true, auth);
}

export async function apiDelete(endpoint, auth = true) {
  return apiRequest(endpoint, 'DELETE', null, false, auth);
}

export async function apiPostForm(endpoint, formData, auth = true) {
  // For FormData, do not set Content-Type header; fetch does it
  const headers = { 'Accept': 'application/json' };
  if (auth) Object.assign(headers, authHeader());

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (response.status === 401) {
    localStorage.removeItem('kanglei_admin_token');
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = './login.html';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
