import { apiPost, apiGet, apiPatch, apiPostForm, apiDelete, toAssetUrl, API_BASE } from './api.js';
import { showToast } from './toast.js';
import { showConfirm } from './confirm.js';

// Paths (Relative to help plain static server)
// Paths (Relative to help plain static server)
const LOGIN_PAGE = 'login.html';
const DASHBOARD_PAGE = './index.html';

document.addEventListener('DOMContentLoaded', () => {

    // Determine Page Type
    const isLoginPage = !!document.getElementById('login-form');
    const isDashboard = !!document.getElementById('appointments-tbody');
    const isGallery = !!document.getElementById('gallery-grid');

    // DEBUG: Populate debug info on login page
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.textContent = `API_BASE: ${API_BASE}`;
    }

    // 1. Auth Guard (Skip if on Login Page)
    if (!isLoginPage) {
        const token = localStorage.getItem('kanglei_admin_token');
        if (!token) {
            window.location.href = LOGIN_PAGE;
            return;
        }
    }

    // 2. Init Logic
    if (isLoginPage) initLogin();
    if (isDashboard) initDashboard();
    if (isGallery) initGallery();

    // Global Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const confirmed = await showConfirm('Are you sure you want to sign out?', 'Sign Out');
            if (confirmed) {
                localStorage.removeItem('kanglei_admin_token');
                window.location.href = LOGIN_PAGE;
            }
        });
    }

    // Expose for usage in HTML onclick
    window.updateStatus = updateStatus;
});

// ... Login Init Code ... (Keep initLogin intact via diff logic if not included, but here I must match context)
// To avoid huge replacement, I'll skip initLogin body in this chunk if possible, or include it if range demands.
// The range I selected (1-137) includes initLogin. So I have to include it or split.
// Let's replace only the top section first (1-7) to update imports? No, I need state variables later down.
// Let's stick to replacing lines 1-137 means I need to re-print initLogin.
// Wait, I can just replacements of smaller blocks.
// Let's replace just line 1 first.


// --- LOGIN PAGE ---
function initLogin() {
    // If already logged in, go to dashboard
    if (localStorage.getItem('kanglei_admin_token')) {
        window.location.href = DASHBOARD_PAGE;
        return;
    }

    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const loading = document.getElementById('login-loading');
    const debugErr = document.getElementById('debug-error');
    const statusEl = document.getElementById('login-status');
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.textContent = `API: ${API_BASE} | Token: ${localStorage.getItem('kanglei_admin_token') ? 'Yes' : 'No'}`;
        debugInfo.classList.remove('opacity-0'); // Make visible for now
    }

    const toggleBtn = document.getElementById('toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const input = document.getElementById('password-input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            // Toggle Icon
            if (type === 'text') {
                toggleBtn.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                `;
            } else {
                toggleBtn.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                `;
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');

        // Reset UI
        if (errorDiv) errorDiv.classList.add('hidden');
        if (debugErr) debugErr.classList.add('hidden');
        if (loading) loading.classList.remove('hidden');
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
        if (statusEl) {
            statusEl.textContent = 'Authenticating...';
            statusEl.className = 'text-center text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 min-h-[20px] transition-all';
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (!data.username || !data.password) {
            if (errorDiv) {
                errorDiv.textContent = 'Please enter both username and password.';
                errorDiv.classList.remove('hidden');
            }
            if (loading) loading.classList.add('hidden');
            btn.disabled = false;
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
            if (statusEl) statusEl.textContent = '';
            return;
        }

        try {
            console.log('Sending login request...');
            const res = await apiPost('/auth/login', data);

            console.log('Login response:', res);

            if (res && res.access_token) {
                if (statusEl) {
                    statusEl.textContent = 'Login successful! Redirecting...';
                    statusEl.classList.add('text-green-600', 'dark:text-green-400');
                }

                localStorage.setItem('kanglei_admin_token', res.access_token);
                showToast('Login successful', 'success');

                // Small delay to let user see success message
                setTimeout(() => {
                    window.location.href = DASHBOARD_PAGE;
                }, 500);

            } else {
                throw new Error('Invalid response from server (No access_token)');
            }
        } catch (err) {
            console.error("Login failed:", err);

            if (errorDiv) {
                errorDiv.textContent = err.message || 'Login failed. Please check credentials.';
                errorDiv.classList.remove('hidden');
            }

            if (statusEl) {
                statusEl.textContent = 'Login failed.';
                statusEl.classList.add('text-red-600');
            }

            if (debugErr) {
                debugErr.textContent = `Error: ${err.message}`;
                debugErr.classList.remove('hidden');
            }

            if (loading) loading.classList.add('hidden');
            btn.disabled = false;
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    });
}

// --- DASHBOARD (APPOINTMENTS) ---
let currentLimit = 50;
let currentOffset = 0;
let selectedIds = new Set();
let loadedAppointments = [];

function initDashboard() {
    // Event bindings
    const searchInput = document.getElementById('search-q');
    const filterSelect = document.getElementById('filter-type');
    let debounceTimer;

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentOffset = 0;
                loadAppointments();
            }, 500);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(debounceTimer);
                currentOffset = 0;
                loadAppointments();
            }
        });
    }

    // Filter
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            currentOffset = 0;
            loadAppointments();
        });
    }

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentOffset >= currentLimit) {
            currentOffset -= currentLimit;
            loadAppointments();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        currentOffset += currentLimit;
        loadAppointments();
    });

    document.getElementById('export-excel').addEventListener('click', () => downloadExport('xlsx'));
    document.getElementById('export-csv').addEventListener('click', () => downloadExport('csv'));

    // Selection Logic
    const selectAllCb = document.getElementById('select-all');

    selectAllCb.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const id = parseInt(cb.dataset.id);
            if (e.target.checked) selectedIds.add(id);
            else selectedIds.delete(id);
        });
        updateDeleteButton();
    });

    // Delegated event for row selection
    document.getElementById('appointments-tbody').addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) selectedIds.add(id);
            else selectedIds.delete(id);

            // Update Select All state
            const all = document.querySelectorAll('.row-checkbox');
            const checked = document.querySelectorAll('.row-checkbox:checked');
            selectAllCb.checked = all.length > 0 && all.length === checked.length;
            selectAllCb.indeterminate = checked.length > 0 && checked.length < all.length;

            updateDeleteButton();
        }
    });

    // Delete Flow
    const deleteBtn = document.getElementById('delete-selected-btn');
    const modal = document.getElementById('delete-modal');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    const deleteMsg = document.getElementById('delete-msg');

    deleteBtn.addEventListener('click', () => {
        if (selectedIds.size === 0) return;
        deleteMsg.textContent = `This action cannot be undone. You are about to delete ${selectedIds.size} appointment(s).`;
        modal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';

        try {
            // Sequential delete loop since no bulk endpoint yet
            const ids = Array.from(selectedIds);
            let successCount = 0;

            for (const id of ids) {
                try {
                    await apiDelete(`/admin/appointments/${id}`, true);
                    successCount++;
                } catch (e) {
                    console.error(`Failed to delete ${id}`, e);
                }
            }

            modal.classList.add('hidden');
            showToast(`Deleted ${successCount} appointment(s)`);

            // Refresh
            selectedIds.clear();
            updateDeleteButton();
            document.getElementById('select-all').checked = false;
            loadAppointments();

        } catch (err) {
            console.error(err);
            showToast('Error processing deletion', 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete';
            modal.classList.add('hidden');
        }
    });

    loadAppointments();
}

function updateDeleteButton() {
    const btn = document.getElementById('delete-selected-btn');
    const countSpan = document.getElementById('selected-count');

    if (selectedIds.size > 0) {
        btn.disabled = false;
        countSpan.textContent = `(${selectedIds.size})`;
        countSpan.classList.remove('hidden');
    } else {
        btn.disabled = true;
        countSpan.textContent = '';
        countSpan.classList.add('hidden');
    }
}

async function loadAppointments() {
    const tbody = document.getElementById('appointments-tbody');
    const searchInput = document.getElementById('search-q');
    const filterSelect = document.getElementById('filter-type');

    // State elements
    const loadingEl = document.getElementById('table-loading');
    const emptyEl = document.getElementById('table-empty');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (tbody) tbody.innerHTML = '';

    const searchQ = searchInput ? searchInput.value.trim() : '';
    const typeFilter = filterSelect ? filterSelect.value.toLowerCase() : '';

    // Reset selection on page load
    selectedIds.clear();
    updateDeleteButton();
    const selectAll = document.getElementById('select-all');
    if (selectAll) selectAll.checked = false;

    const params = new URLSearchParams({
        limit: currentLimit,
        offset: currentOffset
    });
    if (searchQ) params.append('q', searchQ);

    try {
        let data = await apiGet(`/admin/appointments?${params.toString()}`, true);
        loadedAppointments = data || [];

        // Client-side filtering for Type (Safety fallback since backend might not support it)
        if (typeFilter) {
            data = data.filter(item =>
                (item.counseling_type || '').toLowerCase().includes(typeFilter)
            );
        }

        if (!data || data.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            // Update counts if possible, otherwise generic
            const pageInfo = document.getElementById('page-info');
            if (pageInfo) pageInfo.textContent = '0 results';
            return;
        }

        if (tbody) {
            tbody.innerHTML = data.map((apt, index) => `
                <tr class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                    <td class="py-3 px-4 text-center align-middle">
                        <input type="checkbox" data-id="${apt.id}" class="row-checkbox rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4">
                    </td>
                    <td class="py-3 px-4 text-xs font-mono text-slate-500 align-middle">
                        ${currentOffset + index + 1}
                    </td>
                    <td class="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white align-middle">
                        ${apt.name}
                    </td>
                    <td class="py-3 px-4 text-sm font-mono text-slate-600 dark:text-slate-400 align-middle">
                        ${apt.phone}
                    </td>
                    <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 align-middle truncate max-w-[150px]" title="${apt.address || ''}">
                        ${apt.address || '-'}
                    </td>
                    <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 align-middle">
                        <span class="badge ${getBadgeColor(apt.counseling_type)}">
                            ${apt.counseling_type}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 align-middle whitespace-nowrap">
                        ${new Date(apt.created_at).toLocaleDateString()}
                    </td>
                    <td class="py-3 px-4 align-middle">
                        <div class="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title="${apt.message || ''}">
                            ${apt.message || '-'}
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        const pageInfo = document.getElementById('page-info');
        if (pageInfo) pageInfo.textContent = `Showing ${currentOffset + 1} - ${currentOffset + data.length}`;
    } catch (err) {
        console.error("Load failed", err);
        showToast('Failed to load appointments', 'error');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-red-500">Error loading data.</td></tr>`;
    } finally {
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}

function getBadgeColor(type) {
    if (!type) return 'badge-green';
    type = type.toLowerCase();
    if (type.includes('career')) return 'badge-blue';
    if (type.includes('guidance')) return 'badge-green';

    return 'badge-blue';
}

async function updateStatus(id, newStatus) {
    try {
        await apiPatch(`/admin/appointments/${id}/status`, { status: newStatus }, true);
        showToast(`Updated appointment #${id} to ${newStatus}`);
    } catch (err) {
        console.error(err);
        showToast(`Failed to update status: ${err.message}`, 'error');
    }
}

async function downloadExport(format) {
    const token = localStorage.getItem('kanglei_admin_token');
    if (!token) return;

    showToast(`Downloading ${format.toUpperCase()}...`);
    try {
        const res = await fetch(`${API_BASE}/admin/appointments/export?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Download failed');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appointments.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        showToast('Export failed', 'error');
    }
}

// --- GALLERY PAGE ---
// --- GALLERY PAGE ---
function initGallery() {
    loadGalleryImages();

    document.getElementById('refresh-btn').addEventListener('click', loadGalleryImages);

    // Dropzone interaction
    const fileInput = document.getElementById('gallery-file');
    const contentDiv = document.getElementById('dropzone-content');
    const previewDiv = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const sizeEl = document.getElementById('file-size');
            const imgEl = document.getElementById('gallery-preview-img');

            if (file) {
                contentDiv.classList.add('hidden');
                previewDiv.classList.remove('hidden');
                fileName.textContent = file.name;

                // Size
                const distinctSize = file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                if (sizeEl) sizeEl.textContent = distinctSize;

                // Preview
                if (file.type.startsWith('image/') && imgEl) {
                    imgEl.src = URL.createObjectURL(file);
                    imgEl.classList.remove('hidden');
                }
            } else {
                contentDiv.classList.remove('hidden');
                previewDiv.classList.add('hidden');
                if (imgEl && imgEl.src) URL.revokeObjectURL(imgEl.src);
            }
        });
    }

    const form = document.getElementById('gallery-upload-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');

        // Validation check
        if (!fileInput.files.length) {
            showToast('Please select an image', 'error');
            return;
        }

        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        try {
            const formData = new FormData(form);
            await apiPostForm('/admin/gallery', formData, true);
            showToast('Image uploaded successfully', 'success');
            form.reset();

            // Reset Dropzone
            contentDiv.classList.remove('hidden');
            previewDiv.classList.add('hidden');

            loadGalleryImages(); // Refresh grid
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Upload failed', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    });
}

async function loadGalleryImages() {
    const grid = document.getElementById('gallery-grid');
    // Show skeleton
    grid.innerHTML = `
        <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
    `;

    try {
        const images = await apiGet('/gallery'); // Public read

        if (!images || images.length === 0) {
            grid.innerHTML = '';
            const empty = document.getElementById('gallery-empty');
            if (empty) {
                empty.classList.remove('hidden');
                grid.appendChild(empty);
            }
            return;
        }

        // Hide empty state if previously shown
        document.getElementById('gallery-empty')?.classList.add('hidden');

        grid.innerHTML = images.map(img => `
            <div class="relative aspect-square group rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                <img src="${toAssetUrl(img.image_url)}?v=${Date.now()}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p class="text-white text-sm font-medium truncate w-full mb-3">${img.caption || 'No caption'}</p>
                    <button onclick="deleteGalleryImage(${img.id})" 
                        class="bg-red-500/90 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg backdrop-blur-sm transition-colors w-full flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete Image
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        showToast('Failed to load gallery', 'error');
        grid.innerHTML = `<div class="col-span-full h-32 flex items-center justify-center text-red-500">Failed to load gallery.</div>`;
    }
}

async function deleteGalleryImage(id) {
    const confirmed = await showConfirm('Are you sure you want to delete this image?', 'Delete Image');
    if (!confirmed) return;

    try {
        await import('./api.js').then(m => m.apiDelete(`/admin/gallery/${id}`, true));
        showToast('Image deleted');
        loadGalleryImages();
    } catch (err) {
        console.error(err);
        showToast('Failed to delete image', 'error');
    }
}

// Expose to window
window.deleteGalleryImage = deleteGalleryImage;
