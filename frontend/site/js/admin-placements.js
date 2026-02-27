import { apiGet, apiDelete, apiPatch, apiPostForm, toAssetUrl } from './api.js';
import { showToast } from './toast.js';
import { showConfirm } from './confirm.js';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const token = localStorage.getItem('kanglei_admin_token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // Global loader fadeout
    const loader = document.getElementById('global-loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }, 500);
    }
    document.body.style.opacity = '1';

    loadPlacements();
    setupForm();

    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const confirmed = await showConfirm('Are you sure you want to sign out?', 'Sign Out');
        if (confirmed) {
            localStorage.removeItem('kanglei_admin_token');
            window.location.href = './login.html';
        }
    });
});

// ─── Load Placements ───────────────────────────────────────────────────────

async function loadPlacements() {
    const grid = document.getElementById('placements-grid');
    if (!grid) return;

    document.getElementById('placements-empty')?.classList.add('hidden');

    grid.innerHTML = `
        <div class="animate-pulse flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-20 h-20 bg-slate-200 rounded-lg flex-shrink-0"></div>
            <div class="flex-1 space-y-3">
                <div class="h-4 bg-slate-200 rounded w-1/3"></div>
                <div class="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
        </div>
        <div class="animate-pulse flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-20 h-20 bg-slate-200 rounded-lg flex-shrink-0"></div>
            <div class="flex-1 space-y-3">
                <div class="h-4 bg-slate-200 rounded w-1/3"></div>
                <div class="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
        </div>
    `;

    try {
        const placements = await apiGet('/placements/admin', true);

        if (!placements || placements.length === 0) {
            grid.innerHTML = '';
            document.getElementById('placements-empty')?.classList.remove('hidden');
            return;
        }

        grid.innerHTML = placements.map(renderPlacementRow).join('');
        attachDeleteHandlers();
        attachStatusHandlers();

    } catch (err) {
        console.error(err);
        showToast('Failed to load placements', 'error');
        grid.innerHTML = `<div class="text-center py-10 text-red-500 bg-red-50 rounded-lg">Failed to load placements.</div>`;
    }
}

// ─── Render Row ────────────────────────────────────────────────────────────

function renderPlacementRow(item) {
    const cleanedPath = item.image_path
        ? item.image_path.replace(/^static_uploads\//, '')
        : '';
    const imgUrl = cleanedPath
        ? toAssetUrl(`uploads/${cleanedPath}`)
        : toAssetUrl(null);

    const isActive = item.is_active;

    return `
    <div class="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-center group shadow-sm hover:shadow-md transition-all">
        <!-- Thumbnail -->
        <div class="shrink-0 relative bg-slate-100 rounded-lg overflow-hidden" style="width:100px;min-width:100px;height:100px;">
            <img src="${imgUrl}" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" alt="Placement">
            <div class="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-md ${isActive ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-500 text-white'}">
                ${isActive ? 'Active' : 'Inactive'}
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2 w-full">
            <div class="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3 sm:gap-2 w-full text-center sm:text-left">
                <div class="flex-1 min-w-0 w-full">
                    <h4 class="font-bold text-slate-900 truncate text-base mb-1">Placement</h4>
                    <p class="text-xs text-slate-400 truncate w-full relative sm:max-w-none max-w-[200px] mx-auto sm:mx-0">${item.image_path || ''}</p>
                </div>

                <div class="flex items-center justify-center sm:justify-start gap-2 self-center sm:self-center flex-wrap shrink-0">
                    ${!isActive ? `
                    <button data-id="${item.id}" class="activate-btn text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        Activate
                    </button>
                    ` : `
                    <button data-id="${item.id}" class="deactivate-btn text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-md transition-colors" title="Deactivate">
                        Deactivate
                    </button>
                    `}

                    <button data-id="${item.id}" class="delete-btn text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0" title="Permanently Delete">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

// ─── Upload Form ───────────────────────────────────────────────────────────

function setupForm() {
    const form = document.getElementById('placements-upload-form');
    if (!form) return;

    const fileInput = form.querySelector('input[name="file"]');
    const contentDiv = document.getElementById('placement-dropzone-content');
    const previewDiv = document.getElementById('placement-file-preview');
    const fileName = document.getElementById('placement-file-name');
    const fileSize = document.getElementById('placement-file-size');
    const imgPreview = document.getElementById('placement-preview-img');

    if (fileInput && contentDiv && previewDiv) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;
                const size = file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                fileSize.textContent = size;

                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (imgPreview) {
                            imgPreview.src = ev.target.result;
                            contentDiv.classList.add('hidden');
                            previewDiv.classList.remove('hidden');
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    contentDiv.classList.add('hidden');
                    previewDiv.classList.remove('hidden');
                }
            } else {
                contentDiv.classList.remove('hidden');
                previewDiv.classList.add('hidden');
                if (imgPreview) imgPreview.src = '';
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalHtml = btn.innerHTML;

        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        btn.disabled = true;

        try {
            const formData = new FormData(form);
            await apiPostForm('/placements', formData);
            showToast('Placement uploaded!', 'success');
            form.reset();

            if (contentDiv && previewDiv) {
                contentDiv.classList.remove('hidden');
                previewDiv.classList.add('hidden');
                if (imgPreview && imgPreview.src) {
                    URL.revokeObjectURL(imgPreview.src);
                    imgPreview.src = '';
                }
            }

            loadPlacements();
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Upload failed', 'error');
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    });
}

// ─── Delete Handler ────────────────────────────────────────────────────────

function attachDeleteHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const confirmed = await showConfirm('Delete this placement? It will be moved to trash.', 'Delete Placement');
            if (!confirmed) return;

            const id = btn.dataset.id;
            try {
                await apiDelete(`/placements/${id}`);
                showToast('Placement deleted', 'success');
                loadPlacements();
            } catch (err) {
                console.error(err);
                showToast('Delete failed: ' + (err.message || ''), 'error');
            }
        });
    });
}

// ─── Activate / Deactivate ────────────────────────────────────────────────

function attachStatusHandlers() {
    const handleStatus = async (btn) => {
        const id = btn.dataset.id;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        btn.disabled = true;

        try {
            await apiPatch(`/placements/${id}`, {}, true);
            showToast('Status updated', 'success');
            loadPlacements();
        } catch (err) {
            console.error(err);
            showToast('Update failed: ' + (err.message || ''), 'error');
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    };

    document.querySelectorAll('.activate-btn').forEach(btn => {
        btn.addEventListener('click', () => handleStatus(btn));
    });

    document.querySelectorAll('.deactivate-btn').forEach(btn => {
        btn.addEventListener('click', () => handleStatus(btn));
    });
}
