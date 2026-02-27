import { apiPost, apiGet, apiPatch, apiPostForm, apiDelete, toAssetUrl, API_BASE } from './api.js';
import { showToast } from './toast.js';
import { showConfirm } from './confirm.js';

// Paths (Relative to help plain static server)
// Paths (Relative to help plain static server)
const LOGIN_PAGE = '/login';
const DASHBOARD_PAGE = '/index';
// Init wrapper to handle module timing
function init() {
    console.log('Admin JS Init');
    // Force remove global loader (fix blank login on production)
    const loader = document.getElementById('global-loader');
    if (loader) loader.remove();

    document.body.classList.remove('opacity-0');
    document.body.style.opacity = '1';
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
    if (isGallery) initGallery();    // Global Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("Logout clicked - Waiting for confirm");
            const confirmed = await showConfirm('Are you sure you want to sign out?', 'Sign Out');
            if (confirmed) {
                console.log("Confirmed logout. Removing token.");
                localStorage.removeItem('kanglei_admin_token');
                window.location.href = LOGIN_PAGE;
            } else {
                console.log("Logout cancelled/closed.");
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
    let currentlyFiltered = [];
    let currentLocation = 'Imphal'; // Default location
    let currentPage = 1;
    const rowsPerPage = 10;

    // Location Filter Tabs
    const locTabs = document.querySelectorAll('.adm-loc-tab');
    if (locTabs.length) {
        locTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                locTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentLocation = tab.dataset.loc;
                fetchAppointments();
            });
        });
    }

    // Render Function (Client-side filtering)
    const renderTable = () => {
        // 1. Filter
        currentlyFiltered = allAppointments.filter(appt => {
            // Filter by Appointment Type (array check)
            let matchesType = true;
            if (currentFilter) {
                // If appointment_type is array, check if it includes currentFilter
                if (Array.isArray(appt.appointment_type)) {
                    matchesType = appt.appointment_type.includes(currentFilter);
                } else {
                    // Fallback for logic if strict array is expected
                    matchesType = false;
                }
            }

            const matchesSearch = currentSearch
                ? (appt.name.toLowerCase().includes(currentSearch) || appt.phone.includes(currentSearch))
                : true;
            return matchesType && matchesSearch;
        });

        // Track pagination data BEFORE slicing for rendering
        const totalItems = currentlyFiltered.length;
        const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Render Analytics based on ALL filtered data, before pagination chops it up
        calculateAnalytics(currentlyFiltered);

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const pageData = currentlyFiltered.slice(startIndex, endIndex);

        // Update Pagination UI
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (pageInfo) {
            pageInfo.textContent = `Showing ${totalItems === 0 ? 0 : startIndex + 1}–${Math.min(endIndex, totalItems)} of ${totalItems}`;
        }
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
            prevBtn.classList.toggle('opacity-50', currentPage === 1);
            prevBtn.classList.toggle('cursor-not-allowed', currentPage === 1);
        }
        if (nextBtn) {
            const isLast = currentPage === totalPages || totalItems === 0;
            nextBtn.disabled = isLast;
            nextBtn.classList.toggle('opacity-50', isLast);
            nextBtn.classList.toggle('cursor-not-allowed', isLast);
        }

        // 2. Render Check
        tbody.innerHTML = '';

        if (currentlyFiltered.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        pageData.forEach((appt, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group';
            row.dataset.location = appt.location || 'Not Specified';

            const dateStr = new Date(appt.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            const actualRowNumber = startIndex + index + 1;

            row.innerHTML = `
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-center">
                    <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 select-row" value="${appt.id}">
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-mono">
                    ${actualRowNumber.toString().padStart(2, '0')}
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
                    <div class="flex flex-col gap-1">
                        ${(appt.appointment_type && appt.appointment_type.length)
                    ? appt.appointment_type.map(t => `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">${t}</span>`).join('')
                    : '<span class="text-xs text-slate-400">-</span>'}
                    </div>
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-sm">
                   ${appt.guardian_name ? `
                        <div class="font-medium text-slate-900 dark:text-white">${appt.guardian_name}</div>
                        <div class="text-xs text-slate-500">${appt.guardian_contact || ''}</div>
                   ` : '<span class="text-slate-400">-</span>'}
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 whitespace-nowrap">
                    ${appt.date_of_birth || '-'}
                </td>
                <td class="py-3 px-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 whitespace-nowrap">
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

    // ─── Analytics Engine ──────────────────────────────────────────────────
    let analyticsChartInstance = null;

    function calculateAnalytics(data) {
        if (!data) return;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let countToday = 0;
        let countYesterday = 0;
        let countThisMonth = 0;
        let countLastMonth = 0;
        let countThisYear = 0;

        // Array to count last 14 days
        const last14DaysCounts = new Array(14).fill(0);
        const last14DaysLabels = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            last14DaysLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        data.forEach(appt => {
            const created = new Date(appt.created_at);
            if (isNaN(created.getTime())) return;

            if (created >= startOfToday) countToday++;
            else if (created >= startOfYesterday && created < startOfToday) countYesterday++;

            if (created >= startOfMonth) countThisMonth++;
            else if (created >= startOfLastMonth && created < startOfMonth) countLastMonth++;

            if (created >= startOfYear) countThisYear++;

            // Chart distribution
            const diffTime = Math.abs(startOfToday - new Date(created.getFullYear(), created.getMonth(), created.getDate()));
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            // if within 13 days in the past (14 total bounds)
            if (created >= startOfToday) {
                last14DaysCounts[13]++;
            } else if (diffDays > 0 && diffDays <= 13) {
                last14DaysCounts[13 - diffDays]++; // 13 is today, 12 is yesterday...
            }
        });

        // Update UI Text
        const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        safeSet('stat-today', countToday);
        safeSet('stat-yesterday', countYesterday);
        safeSet('stat-month', countThisMonth);
        safeSet('stat-year', countThisYear);
        safeSet('stat-total', data.length);

        // Trend calculations
        const trendToday = document.getElementById('trend-today');
        if (trendToday) {
            if (countYesterday === 0) {
                trendToday.innerHTML = countToday > 0 ? `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> +100%` : '-';
                trendToday.className = countToday > 0 ? 'adm-stat-trend positive' : 'adm-stat-trend neutral';
            } else {
                const perc = Math.round(((countToday - countYesterday) / countYesterday) * 100);
                if (perc > 0) {
                    trendToday.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> +${perc}%`;
                    trendToday.className = 'adm-stat-trend positive';
                } else if (perc < 0) {
                    trendToday.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg> ${perc}%`;
                    trendToday.className = 'adm-stat-trend negative';
                } else {
                    trendToday.innerHTML = `0%`;
                    trendToday.className = 'adm-stat-trend neutral';
                }
            }
        }

        const trendMonth = document.getElementById('trend-month');
        if (trendMonth) {
            if (countLastMonth === 0) {
                trendMonth.innerHTML = countThisMonth > 0 ? `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> +100%` : '-';
                trendMonth.className = countThisMonth > 0 ? 'adm-stat-trend positive' : 'adm-stat-trend neutral';
            } else {
                const percM = Math.round(((countThisMonth - countLastMonth) / countLastMonth) * 100);
                if (percM > 0) {
                    trendMonth.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> +${percM}%`;
                    trendMonth.className = 'adm-stat-trend positive';
                } else if (percM < 0) {
                    trendMonth.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg> ${percM}%`;
                    trendMonth.className = 'adm-stat-trend negative';
                } else {
                    trendMonth.innerHTML = `0%`;
                    trendMonth.className = 'adm-stat-trend neutral';
                }
            }
        }

        renderChart(last14DaysLabels, last14DaysCounts);
    }

    function renderChart(labels, data) {
        const ctx = document.getElementById('appointmentsChart');
        if (!ctx) return;

        // If Chart.js isn't loaded yet via CDN, retry in 500ms
        if (!window.Chart) {
            setTimeout(() => renderChart(labels, data), 500);
            return;
        }

        if (analyticsChartInstance) {
            analyticsChartInstance.destroy();
        }

        // Create sleek gradient
        const canvasCtx = ctx.getContext('2d');
        const gradientInfo = canvasCtx.createLinearGradient(0, 0, 0, 300);
        gradientInfo.addColorStop(0, 'rgba(37, 99, 235, 0.2)');   // adm-blue-mid
        gradientInfo.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

        analyticsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Appointments',
                    data: data,
                    borderColor: '#2563eb', // adm-blue-mid
                    backgroundColor: gradientInfo,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4 // Smooth curve
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        titleFont: { family: 'Inter', size: 13 },
                        bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                        displayColors: false,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)', borderDash: [4, 4], drawBorder: false },
                        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b', stepSize: 1, precision: 0 }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        });
    }

    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (currentlyFiltered.length === 0) {
                if (typeof showToast === 'function') showToast("No records to export.", "error");
                else alert("No records to export.");
                return;
            }

            if (typeof XLSX === 'undefined') {
                if (typeof showToast === 'function') showToast("Excel export library not loaded.", "error");
                else alert("Excel export library not loaded.");
                return;
            }

            const originalText = exportExcelBtn.innerHTML;
            exportExcelBtn.innerHTML = `
                <svg class="w-4 h-4 animate-spin inline-block mr-1" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exporting...</span>`;
            exportExcelBtn.disabled = true;

            try {
                const headers = ['SL No.', 'Name', 'Phone', 'Address', 'Type', 'Guardian Details', 'DOB', 'Appointment Date', 'Message'];
                const excelData = [headers];

                currentlyFiltered.forEach((appt, index) => {
                    const typeStr = Array.isArray(appt.appointment_type) ? appt.appointment_type.join('; ') : (appt.appointment_type || '-');
                    const dateStr = new Date(appt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    const row = [
                        index + 1,
                        appt.name || '',
                        appt.phone || '',
                        appt.address || '',
                        typeStr,
                        appt.guardian_name ? `${appt.guardian_name} (${appt.guardian_contact || ''})` : '',
                        appt.date_of_birth || '',
                        dateStr,
                        appt.message || ''
                    ];
                    excelData.push(row);
                });

                // Create Workbook
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(excelData);

                // Auto-size columns slightly
                const colWidths = [
                    { wch: 8 },  // SL No
                    { wch: 20 }, // Name
                    { wch: 15 }, // Phone
                    { wch: 30 }, // Address
                    { wch: 15 }, // Type
                    { wch: 25 }, // Guardian
                    { wch: 12 }, // DOB
                    { wch: 18 }, // Appt Date
                    { wch: 40 }  // Message
                ];
                ws['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws, "Appointments");

                // Download
                const filename = `Appointments_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
                XLSX.writeFile(wb, filename);

                if (typeof showToast === 'function') showToast("Excel exported successfully!", "success");

            } catch (err) {
                console.error("Excel Export failed:", err);
                if (typeof showToast === 'function') showToast("Failed to generate Excel file.", "error");
            } finally {
                exportExcelBtn.innerHTML = originalText;
                exportExcelBtn.disabled = false;
            }
        });
    }

    const fetchAppointments = async () => {
        tbody.style.opacity = '0.5';
        if (loading) loading.classList.remove('hidden');

        try {
            // Fetch all (limit 1000) for client-side filtering applies location from DB directly
            let endpoint = `/admin/appointments?limit=1000`;
            if (currentLocation) {
                endpoint += `&location=${currentLocation}`;
            }

            allAppointments = await apiGet(endpoint, true);
            tbody.style.opacity = '1';

            renderTable();

        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Failed to load appointments', 'error');
            tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-red-500">Error loading data. ${err.message}</td></tr>`;
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
            currentPage = 1;
            renderTable();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            currentPage = 1;
            renderTable();
        });
    }

    // Pagination Listeners
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(currentlyFiltered.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            } // Prevent double clicking explicitly
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
