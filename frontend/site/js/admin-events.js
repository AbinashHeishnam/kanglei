import { apiGet, apiPost, apiDelete, apiPostForm, apiPatch, toAssetUrl } from './api.js';
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
        attachStatusHandlers();
        startCountdownLoop();

    } catch (err) {
        console.error(err);
        showToast('Failed to load events', 'error');
        grid.innerHTML = `<div class="text-center py-10 text-red-500 bg-red-50 rounded-lg">Failed to load events.</div>`;
    }
}

// Global interval for countdowns
let countdownInterval;

function renderEventRow(evt) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '<span class="text-slate-400">Not set</span>';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    };

    // Calculate Scheduled Status
    let scheduleStatus = '';
    let isScheduled = false;

    if (!evt.is_active && evt.starts_at) {
        const start = new Date(evt.starts_at).getTime();
        const now = Date.now();
        if (start > now) {
            isScheduled = true;
            scheduleStatus = `<div class="countdown-timer text-xs font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded" data-target="${start}" data-id="${evt.id}">Waiting...</div>`;
        }
    }

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
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 dark:text-white truncate text-base mb-1">${evt.title || '<span class="italic text-slate-400">Untitled Event</span>'}</h4>
                        ${scheduleStatus}
                    </div>
                    
                    <div class="flex items-center gap-2">
                        ${!evt.is_active ? `
                        <button data-id="${evt.id}" class="activate-btn text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            Activate Now
                        </button>
                        ` : `
                        <button data-id="${evt.id}" class="deactivate-btn text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1.5 rounded-md transition-colors" title="Deactivate">
                            Deactivate
                        </button>
                        `}
                        
                        <button data-id="${evt.id}" class="delete-btn text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete Event">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <div class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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

function startCountdownLoop() {
    if (countdownInterval) clearInterval(countdownInterval);

    // Ticker function
    const tick = () => {
        const els = document.querySelectorAll('.countdown-timer');
        if (els.length === 0) return;

        const now = Date.now();
        els.forEach((el) => {
            if (el.dataset.activating) return; // Prevent double firing

            const target = parseInt(el.dataset.target);
            const diff = target - now;

            if (diff <= 0) {
                el.dataset.activating = "true";
                el.textContent = "Activating...";
                el.classList.add('text-green-600', 'animate-pulse');

                // Trigger backend activation via simple reload
                // The GET request will check and activate due events
                console.log(`Timer expired for event ${el.dataset.id}. Reloading to trigger activation...`);
                setTimeout(() => {
                    loadEvents();
                    showToast('Event activated!', 'success');
                }, 1000);

            } else {
                // Formatting
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                el.textContent = `Activates in: ${hours}h ${mins}m ${secs}s`;
            }
        });
    };

    tick();
    countdownInterval = setInterval(tick, 1000);
}

function setupForm() {
    console.log('Setting up events form...');
    const form = document.getElementById('events-upload-form');
    if (!form) {
        console.warn('Events form not found in DOM');
        return;
    }

    // File Preview Logic
    const fileInput = form.querySelector('input[name="file"]');
    const contentDiv = document.getElementById('events-dropzone-content');
    const previewDiv = document.getElementById('events-file-preview');
    const fileName = document.getElementById('events-file-name');
    const fileSize = document.getElementById('events-file-size');
    const imgPreview = document.getElementById('events-preview-img');

    if (fileInput && contentDiv && previewDiv) {
        fileInput.addEventListener('change', (e) => {
            console.log('Event File selected:', e.target.files[0]);
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;

                // Size
                const size = file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                fileSize.textContent = size;

                // Preview
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (imgPreview) {
                            imgPreview.src = ev.target.result;
                            // Toggle Containers
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
    } else {
        console.error('Missing elements for events file preview:', { fileInput, contentDiv, previewDiv });
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
        console.log('Event Upload Submitted');
        const btn = form.querySelector('button[type="submit"]');
        const originalHtml = btn.innerHTML;

        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        btn.disabled = true;

        try {
            const formData = new FormData(form);
            const isActive = form.querySelector('[name="is_active"]').checked;
            formData.set('is_active', isActive);

            // Cleanse empty dates to prevent backend validation error
            if (!formData.get('starts_at')) formData.delete('starts_at');
            if (!formData.get('ends_at')) formData.delete('ends_at');

            console.log('Uploading event data...', formData);

            await apiPostForm('/admin/events', formData);
            showToast('Event poster published!', 'success');
            form.reset();

            // Reset Preview
            if (contentDiv && previewDiv) {
                contentDiv.classList.remove('hidden');
                previewDiv.classList.add('hidden');
                if (imgPreview.src) URL.revokeObjectURL(imgPreview.src);
            }

            loadEvents();
        } catch (err) {
            console.error(err);
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

function attachStatusHandlers() {
    const handleStatus = async (btn, newStatus) => {
        const id = btn.dataset.id;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        btn.disabled = true;

        try {
            await apiPatch(`/admin/events/${id}/status?is_active=${newStatus}`, {});
            loadEvents();
            showToast(newStatus ? 'Event activated' : 'Event deactivated', 'success');
        } catch (err) {
            showToast('Update failed: ' + err.message, 'error');
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    };

    document.querySelectorAll('.activate-btn').forEach(btn => {
        btn.addEventListener('click', () => handleStatus(btn, true));
    });

    document.querySelectorAll('.deactivate-btn').forEach(btn => {
        btn.addEventListener('click', () => handleStatus(btn, false));
    });
}
