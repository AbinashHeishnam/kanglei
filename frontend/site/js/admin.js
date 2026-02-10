import { apiPost, apiGet, apiPatch, apiPostForm, apiDelete, toAssetUrl, API_BASE } from './api.js';
import { showToast } from './toast.js';
import { showConfirm } from './confirm.js';

// Paths (Relative to help plain static server)
// Paths (Relative to help plain static server)
const LOGIN_PAGE = 'login.html';
const DASHBOARD_PAGE = './index.html';

// Init wrapper to handle module timing
function init() {
    console.log('Admin JS Init');

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

    // Expose only if it exists (prevents blank page crash)
    if (typeof updateStatus !== 'undefined') {
        window.updateStatus = updateStatus;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- LOGIN PAGE ---
function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const loading = document.getElementById('login-loading');
        const errorDiv = document.getElementById('login-error');
        const statusDiv = document.getElementById('login-status');

        // Reset UI
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
        btn.disabled = true;
        loading.classList.remove('hidden');
        statusDiv.textContent = 'Authenticating...';

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        try {
            console.log('Attempting login...');
            // apiPost defaults to auth=false, which is correct for login
            const res = await apiPost('/auth/login', payload);

            if (res.access_token) {
                statusDiv.textContent = 'Login successful! Redirecting...';
                statusDiv.classList.add('text-green-600');

                localStorage.setItem('kanglei_admin_token', res.access_token);

                // Small delay for UX
                setTimeout(() => {
                    window.location.href = DASHBOARD_PAGE;
                }, 500);
            } else {
                throw new Error('No access token received');
            }
        } catch (err) {
            console.error('Login error:', err);
            errorDiv.textContent = err.message || 'Login failed. Please check your credentials.';
            errorDiv.classList.remove('hidden');
            statusDiv.textContent = '';
            btn.disabled = false;
            loading.classList.add('hidden');
        }
    });

    // Toggle Password Visibility
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('password-input');
    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
        });
    }
}

// --- DASHBOARD (APPOINTMENTS) ---
async function initDashboard() {
    const tbody = document.getElementById('appointments-tbody');
    const loading = document.getElementById('table-loading');
    const empty = document.getElementById('table-empty');
    if (!tbody) return;

    // Search & Filter elements
    const searchInput = document.getElementById('search-q');
    const filterSelect = document.getElementById('filter-type');
    const selectedCount = document.getElementById('selected-count');
    const deleteBtn = document.getElementById('delete-selected-btn');

    let allAppointments = []; // Store source of truth
    let currentFilter = '';
    let currentSearch = '';

    // Render Function (Client-side filtering)
    const renderTable = () => {
        // 1. Filter
        let filtered = allAppointments.filter(appt => {
            const matchesType = currentFilter ? appt.counseling_type === currentFilter : true;
            const matchesSearch = currentSearch
                ? (appt.name.toLowerCase().includes(currentSearch) || appt.phone.includes(currentSearch))
                : true;
            return matchesType && matchesSearch;
        });

        // 2. Render
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');

        filtered.forEach((appt, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group';

            const dateStr = new Date(appt.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            const badgeColor = (appt.counseling_type === 'Career Counseling')
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : (appt.counseling_type === 'Study Abroad')
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

            row.innerHTML = `
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-center">
                    <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 select-row" value="${appt.id}">
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-mono">
                    ${(index + 1).toString().padStart(2, '0')}
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                    <div class="font-medium text-slate-900 dark:text-white">${appt.name}</div>
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                    ${appt.phone}
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 truncate max-w-[150px]" title="${appt.address || ''}">
                    ${appt.address || '-'}
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor} capitalize">
                        ${appt.counseling_type}
                    </span>
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500">
                    ${dateStr}
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 truncate max-w-[200px]" title="${appt.message || ''}">
                    ${appt.message || '-'}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Re-attach checkbox listeners
        updateCheckboxListeners();
    };

    const fetchAppointments = async () => {
        tbody.style.opacity = '0.5';
        if (loading) loading.classList.remove('hidden');

        try {
            // Fetch all (limit 1000) for client-side filtering
            allAppointments = await apiGet(`/admin/appointments?limit=1000`, true);
            tbody.style.opacity = '1';

            renderTable();

        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Failed to load appointments', 'error');
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-red-500">Error loading data. ${err.message}</td></tr>`;
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    };

    // Initial Fetch
    fetchAppointments();

    // Attach Listeners
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.trim().toLowerCase();
            renderTable();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderTable();
        });
    }

    // Checkbox Helper
    function updateCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.select-row');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateSelectionState);
        });
    }

    function updateSelectionState() {
        const checked = document.querySelectorAll('.select-row:checked').length;
        if (deleteBtn) deleteBtn.disabled = checked === 0;
        if (selectedCount) {
            selectedCount.textContent = `(${checked})`;
            checked > 0 ? selectedCount.classList.remove('hidden') : selectedCount.classList.add('hidden');
        }
    }

    // Select All
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.select-row');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateSelectionState();
        });
    }

    // --- BULK DELETE ---
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const checkedBoxes = document.querySelectorAll('.select-row:checked');
            const ids = Array.from(checkedBoxes).map(cb => cb.value);

            if (ids.length === 0) return;

            const confirmed = await showConfirm(`Are you sure you want to delete ${ids.length} appointment(s)?`, 'Delete Appointments');
            if (!confirmed) return;

            const origText = deleteBtn.innerHTML;
            deleteBtn.innerHTML = 'Deleting...';
            deleteBtn.disabled = true;

            try {
                // Execute deletes in parallel (Soft Delete per backend logic)
                const deletePromises = ids.map(id => apiDelete(`/admin/appointments/${id}`, true));
                await Promise.all(deletePromises);

                showToast('Appointments deleted successfully', 'success');

                // Refresh data
                await fetchAppointments();

                // Reset Selection
                if (selectAll) selectAll.checked = false;
                updateSelectionState();

            } catch (err) {
                console.error('Delete error:', err);
                showToast('Partially failed to delete some items', 'error');
                fetchAppointments(); // Refresh anyway to show what remains
            } finally {
                deleteBtn.innerHTML = origText;
                // Disabled state will be handled by updateSelectionState after refresh
            }
        });
    }
}

// --- GALLERY PAGE ---
function initGallery() {
    loadGalleryImages();

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadGalleryImages);

    // Event Delegation for Delete
    const grid = document.getElementById('gallery-grid');
    if (grid) {
        grid.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (!deleteBtn) return;

            const id = deleteBtn.dataset.id;
            if (!id) return;

            const confirmed = await showConfirm('Are you sure you want to delete this image?', 'Delete Image');
            if (!confirmed) return;

            const btnContent = deleteBtn.innerHTML;
            deleteBtn.innerHTML = '<span class="animate-pulse">...</span>';
            deleteBtn.disabled = true;

            try {
                await apiDelete(`/admin/gallery/${id}`, true);
                showToast('Image deleted');
                loadGalleryImages();
            } catch (err) {
                console.error(err);
                showToast('Failed to delete image', 'error');
                deleteBtn.innerHTML = btnContent;
                deleteBtn.disabled = false;
            }
        });
    }

    // Dropzone interaction
    const fileInput = document.getElementById('gallery-file');
    const contentDiv = document.getElementById('dropzone-content');
    const previewDiv = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            console.log('File selected:', e.target.files[0]);
            const file = e.target.files[0];
            const sizeEl = document.getElementById('file-size');
            const imgEl = document.getElementById('gallery-preview-img');

            if (file) {
                // Show filename
                fileName.textContent = file.name;

                // Show Size
                const distinctSize = file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                if (sizeEl) sizeEl.textContent = distinctSize;

                // Prepare Preview
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (imgEl) {
                            imgEl.src = ev.target.result;
                            imgEl.classList.remove('hidden');

                            // Toggle Containers
                            if (contentDiv) contentDiv.classList.add('hidden');
                            if (previewDiv) previewDiv.classList.remove('hidden');

                            console.log('Preview image loaded via FileReader');
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Not an image, but show selected state
                    if (contentDiv) contentDiv.classList.add('hidden');
                    if (previewDiv) previewDiv.classList.remove('hidden');
                    if (imgEl) imgEl.classList.add('hidden');
                }
            } else {
                // No file selected (cancel)
                if (contentDiv) contentDiv.classList.remove('hidden');
                if (previewDiv) previewDiv.classList.add('hidden');
                if (imgEl) {
                    imgEl.src = '';
                    imgEl.classList.add('hidden');
                }
            }
        });
    }

    const form = document.getElementById('gallery-upload-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Upload submitted');
            const btn = form.querySelector('button[type="submit"]');

            // Validation check
            if (!fileInput || !fileInput.files.length) {
                showToast('Please select an image', 'error');
                return;
            }

            const origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

            try {
                const formData = new FormData(form);
                console.log('Uploading...', formData);

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
                    <!-- UPDATED DELETE BUTTON: data-id only, no onclick -->
                    <button data-id="${img.id}" 
                        class="delete-btn bg-red-500/90 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg backdrop-blur-sm transition-colors w-full flex items-center justify-center gap-2">
                        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
