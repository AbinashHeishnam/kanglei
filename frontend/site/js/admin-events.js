import { apiGet, apiPost, apiDelete, apiPostForm, toAssetUrl } from './api.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const token = localStorage.getItem('kanglei_admin_token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    loadEvents();
    setupForm();

    document.getElementById('refresh-btn')?.addEventListener('click', loadEvents);
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('kanglei_admin_token');
        window.location.href = './login.html';
    });
});

async function loadEvents() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    // Remove empty state if visible
    document.getElementById('events-empty')?.classList.add('hidden');

    // Show Skeleton (simulated by HTML being present initially, but we can re-inject if needed)
    // For refresh, we want to show skeleton again:
    grid.innerHTML = `
        <div class="animate-pulse flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div class="flex-1 space-y-3">
                <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
        </div>
        <div class="animate-pulse flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div class="flex-1 space-y-3">
                <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
        </div>
    `;

    try {
        const events = await apiGet('/admin/events', true);

        if (!events || events.length === 0) {
            grid.innerHTML = '';
            document.getElementById('events-empty')?.classList.remove('hidden');
            return;
        }

        grid.innerHTML = events.map(renderEventRow).join('');
        attachDeleteHandlers();

    } catch (err) {
        console.error(err);
        showToast('Failed to load events', 'error');
        grid.innerHTML = `<div class="text-center py-10 text-red-500 bg-red-50 rounded-lg">Failed to load events.</div>`;
    }
}

function renderEventRow(evt) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '<span class="text-slate-400">Not set</span>';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    };

    return `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center group shadow-sm hover:shadow-md transition-all">
            <!-- Thumbnail -->
            <div class="w-full sm:w-24 h-48 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img src="${toAssetUrl(evt.image_url)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md ${evt.is_active ? 'bg-green-500/90 text-white shadow-sm' : 'bg-slate-500/90 text-white'}">
                    ${evt.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0 w-full">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-slate-900 dark:text-white truncate text-base mb-1">${evt.title || '<span class="italic text-slate-400">Untitled Event</span>'}</h4>
                    <button data-id="${evt.id}" class="delete-btn text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete Event">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                
                <div class="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <div class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>Start: <span class="font-medium text-slate-700 dark:text-slate-300">${formatDate(evt.starts_at)}</span></span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>End: <span class="font-medium text-slate-700 dark:text-slate-300">${formatDate(evt.ends_at)}</span></span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupForm() {
    const form = document.getElementById('events-upload-form');
    if (!form) return;

    // File Preview Logic
    const fileInput = form.querySelector('input[name="file"]');
    const contentDiv = document.getElementById('events-dropzone-content');
    const previewDiv = document.getElementById('events-file-preview');
    const fileName = document.getElementById('events-file-name');
    const fileSize = document.getElementById('events-file-size');
    const imgPreview = document.getElementById('events-preview-img');

    if (fileInput && contentDiv && previewDiv) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                contentDiv.classList.add('hidden');
                previewDiv.classList.remove('hidden');
                fileName.textContent = file.name;

                // Size
                const size = file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                fileSize.textContent = size;

                // Image
                if (file.type.startsWith('image/')) {
                    imgPreview.src = URL.createObjectURL(file);
                }
            } else {
                contentDiv.classList.remove('hidden');
                previewDiv.classList.add('hidden');
                if (imgPreview.src) URL.revokeObjectURL(imgPreview.src);
            }
        });
    }

    // Initialize Flatpickr
    if (window.flatpickr) {
        flatpickr('input[name="starts_at"]', {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true
        });
        flatpickr('input[name="ends_at"]', {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true
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
            const isActive = form.querySelector('[name="is_active"]').checked;
            formData.set('is_active', isActive);

            await apiPostForm('/admin/events', formData);
            showToast('Event poster published!', 'success');
            form.reset();

            // Reset Preview
            if (contentDiv && previewDiv) {
                contentDiv.classList.remove('hidden');
                previewDiv.classList.add('hidden');
                if (imgPreview.src) URL.revokeObjectURL(imgPreview.src);
            }

            // Re-init flatpickr or reset native inputs (handled by form.reset usually)

            loadEvents();
        } catch (err) {
            showToast(err.message || 'Upload failed', 'error');
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    });
}

import { showConfirm } from './confirm.js';

function attachDeleteHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const confirmed = await showConfirm('Are you sure you want to delete this event poster?', 'Delete Event');
            if (!confirmed) return;

            const id = btn.dataset.id;
            try {
                await apiDelete(`/admin/events/${id}`);
                loadEvents();
            } catch (err) {
                showToast('Delete failed: ' + err, 'error');
            }
        });
    });
}
