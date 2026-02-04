import { apiGet, apiPost, apiDelete, apiPostForm, toAssetUrl } from '../js/api.js';

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

    grid.innerHTML = '<div class="text-center py-10 text-slate-500">Loading...</div>';

    try {
        const events = await apiGet('/admin/events', true);

        if (events.length === 0) {
            grid.innerHTML = `
                <div class="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p class="text-slate-500">No event posters found.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = events.map(renderEventRow).join('');
        attachDeleteHandlers();

    } catch (err) {
        grid.innerHTML = `<div class="text-center py-10 text-red-500">Failed to load events.</div>`;
        console.error(err);
    }
}

function renderEventRow(evt) {
    const start = evt.starts_at ? new Date(evt.starts_at).toLocaleString() : '-';
    const end = evt.ends_at ? new Date(evt.ends_at).toLocaleString() : '-';

    return `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center group">
            <div class="w-full sm:w-24 h-32 sm:h-24 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img src="${toAssetUrl(evt.image_url)}" class="w-full h-full object-cover">
                ${evt.is_active ?
            '<span class="absolute top-1 left-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>' :
            '<span class="absolute top-1 left-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>'
        }
            </div>
            
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 dark:text-white truncate">${evt.title || 'Untitled Event'}</h4>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                    <p>Start: ${start}</p>
                    <p>End:   ${end}</p>
                </div>
            </div>

            <button data-id="${evt.id}" class="delete-btn p-2 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>
    `;
}

function setupForm() {
    const form = document.getElementById('events-upload-form');
    if (!form) return;

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
        const originalText = btn.textContent;
        btn.textContent = 'Uploading...';
        btn.disabled = true;

        try {
            const formData = new FormData(form);
            // Handle checkbox manually if needed, but FormData usually handles it. 
            // If unchecked, it might not be sent. API expects 'true'/'false' or boolean.
            // Checkbox value is 'on' if checked.
            const isActive = form.querySelector('[name="is_active"]').checked;
            formData.set('is_active', isActive);

            await apiPostForm('/admin/events', formData);
            form.reset();
            loadEvents();
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

function attachDeleteHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to delete this event poster?')) return;

            const id = btn.dataset.id;
            try {
                await apiDelete(`/admin/events/${id}`);
                loadEvents();
            } catch (err) {
                alert('Delete failed: ' + err);
            }
        });
    });
}
