
// admin-export.js (SINGLE BUTTON: Bottom Sheet on Mobile, Modal on Desktop)

window.__EXPORT_ARMED = false;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cleanup & Setup
    const oldPanel = document.getElementById("export-panel");
    if (oldPanel) oldPanel.remove();

    const downloadBtn = document.getElementById("download-trigger");
    if (!downloadBtn) return;

    // 2. Create Responsive Export Panel
    const panel = document.createElement("div");
    panel.id = "export-panel";
    // Fixed overlay that covers screen
    panel.className = "fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300";

    panel.innerHTML = `
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300" id="export-backdrop"></div>
        
        <!-- Content: Bottom Sheet (Mobile) -> Modal (Desktop) -->
        <div class="relative w-full bg-white dark:bg-slate-900 
                    rounded-t-2xl sm:rounded-2xl 
                    shadow-2xl 
                    transform translate-y-full sm:translate-y-10 opacity-0 sm:scale-95
                    transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                    pointer-events-auto overflow-hidden 
                    border-t sm:border border-slate-100 dark:border-slate-800
                    max-w-md mx-auto sm:mx-4" 
             id="export-content">
             
            <div class="p-6 pb-8 sm:pb-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Export Options
                    </h3>
                    <button id="close-export" class="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" type="button">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <!-- Options Grid -->
                <div class="space-y-3">
                    <button type="button" data-export="csv" class="w-full flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group active:scale-[0.98]">
                        <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform pointer-events-none">
                            <span class="font-bold text-xs">CSV</span>
                        </div>
                        <div class="text-left pointer-events-none">
                            <div class="font-semibold text-slate-900 dark:text-white">CSV Format</div>
                            <div class="text-xs text-slate-500">Spreadsheet compatible</div>
                        </div>
                    </button>

                    <button type="button" data-export="xlsx" class="w-full flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group active:scale-[0.98]">
                        <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform pointer-events-none">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div class="text-left pointer-events-none">
                            <div class="font-semibold text-slate-900 dark:text-white">Excel (XLSX)</div>
                            <div class="text-xs text-slate-500">Formatted tables</div>
                        </div>
                    </button>

                    <button type="button" data-export="pdf" class="w-full flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group active:scale-[0.98]">
                        <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform pointer-events-none">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        </div>
                        <div class="text-left pointer-events-none">
                            <div class="font-semibold text-slate-900 dark:text-white">PDF Document</div>
                            <div class="text-xs text-slate-500">Printable report</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // 3. State & Animation Helpers
    let isOpen = false;
    let exportBlockedUntil = 0;
    const content = panel.querySelector('#export-content');
    const backdrop = panel.querySelector('#export-backdrop');
    const closeBtn = panel.querySelector('#close-export');

    function openPanel() {
        if (isOpen) return;
        isOpen = true;
        // Safety lock against ghost clicks (tap-throughs)
        exportBlockedUntil = Date.now() + 500;

        // ISSUE 1 FIX: Prevent immediate close on mobile
        // Set a timestamp before which outside clicks are ignored
        panel.dataset.ignoreOutsideUntil = Date.now() + 500;

        panel.classList.remove('opacity-0', 'pointer-events-none');

        content.classList.remove('translate-y-full', 'opacity-0', 'sm:translate-y-10', 'sm:scale-95');
        content.classList.add('translate-y-0', 'opacity-100', 'sm:translate-y-0', 'sm:scale-100');
    }

    function closePanel() {
        if (!isOpen) return;
        isOpen = false;
        panel.classList.add('pointer-events-none', 'opacity-0');

        content.classList.add('translate-y-full', 'opacity-0', 'sm:translate-y-10', 'sm:scale-95');
        content.classList.remove('translate-y-0', 'opacity-100', 'sm:translate-y-0', 'sm:scale-100');
    }

    // 4. Bind Open Trigger (Use pointerdown for responsive snap)
    downloadBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isOpen) closePanel();
        else openPanel();
    }, { capture: true });

    // Neutralize standard click
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, { capture: true });


    // 5. Bind Close Triggers
    // Close button always works
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closePanel();
    });

    // Outside Click Handling (Document Level for robustness)
    document.addEventListener('pointerdown', (e) => {
        if (!isOpen) return;

        // Ignore if clicking inside content
        if (content.contains(e.target)) return;

        // Ignore if clicking the trigger button
        if (downloadBtn.contains(e.target)) return;

        // ISSUE 1 FIX: Check ignore window
        const ignoreUntil = parseInt(panel.dataset.ignoreOutsideUntil || 0);
        if (Date.now() < ignoreUntil) return;

        e.preventDefault();
        e.stopPropagation();
        closePanel();
    }, { capture: true });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) closePanel();
    });


    // 6. Bind Export Actions (Delegated)
    content.addEventListener('pointerup', (e) => {
        const btn = e.target.closest('[data-export]');
        if (!btn) return;

        // Safety check: Don't fire if tapped immediately after opening (ghost click)
        if (Date.now() < exportBlockedUntil) {
            console.warn("Ghost click blocked on export.");
            return;
        }

        e.preventDefault();

        window.__EXPORT_ARMED = true;
        const type = btn.dataset.export;
        const table = document.querySelector('table.table-premium');

        try {
            if (!table) return;
            if (type === 'csv') exportCSV(table);
            else if (type === 'xlsx') exportExcel(table);
            else if (type === 'pdf') exportPDF(table);
        } catch (err) {
            console.error(err);
        } finally {
            window.__EXPORT_ARMED = false;
            closePanel();
        }
    }, { capture: true });


    // --- EXPORT IMPLEMENTATION ---
    function exportCSV(table) {
        if (!window.__EXPORT_ARMED) return;
        const rows = Array.from(table.querySelectorAll('tr'));
        const csvContent = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            return cells.map(cell => `"${String(cell.innerText || "").replace(/"/g, '""')}"`).join(',');
        }).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `kanglei_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    function exportExcel(table) {
        if (!window.__EXPORT_ARMED) return;
        if (!window.XLSX) return console.error('XLSX lib not found');
        const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
        XLSX.writeFile(wb, `kanglei_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    function exportPDF(table) {
        if (!window.__EXPORT_ARMED) return;
        if (!window.jspdf?.jsPDF) return console.error('jsPDF lib not found');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.autoTable({ html: table });
        doc.save(`kanglei_export_${new Date().toISOString().split('T')[0]}.pdf`);
    }
});