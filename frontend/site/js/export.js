
import { API_BASE, authHeader } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('download-trigger'); // Reusing existing ID from HTML or changing it? 
    // Plan said: "Update Export button to have ID exportCsvBtn"
    // So I should look for the button in HTML and update ID, or just select by existing ID and update it.
    // Existing HTML has restriction: "Do NOT change UI layout/styles except adding ONE Export button if it already exists (reuse existing button if present)."
    // Existing button: <button id="download-trigger" ...>
    // I will modify HTML to change ID to exportCsvBtn as per plan.

    // But wait, I can just use the new ID here assuming I update HTML in next step.
    initExport();
    initPdfExport();
});

function initExport() {
    const btn = document.getElementById('exportCsvBtn');
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
        if (!e.isTrusted) return;
        e.preventDefault();

        const originalText = btn.innerHTML;

        try {
            // 1. Disable & Loading State
            btn.disabled = true;
            btn.innerHTML = `
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Downloading...</span>
            `;

            // 2. Fetch Blob
            const response = await fetch(`${API_BASE}/admin/appointments/export?format=csv`, {
                method: 'GET',
                headers: {
                    ...authHeader()
                }
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const blob = await response.blob();

            // 3. Extract Filename or Default
            let filename = `appointments_${new Date().toISOString().slice(0, 10)}.csv`;
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // 4. Trigger Download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // 5. Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Success Toast (Optional, but good UX)
            // Assuming showToast exists or just silent success. Plan said "toast/alert".
            // I'll check if toast.js is available. It was in file list.
            // For now, I'll stick to button state restoration.

        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to download CSV. Please try again.');
        } finally {
            // Restore Button
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

function initPdfExport() {
    const btn = document.getElementById('exportPdfBtn');
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Check if library is loaded
        if (!window.jspdf) {
            alert('PDF Library not loaded. Please refresh details.');
            return;
        }

        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-pulse">Generating...</span>`;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF(); // Default A4 portrait

            // Title
            doc.setFontSize(18);
            doc.text('Kanglei Career Solution - Appointments', 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            const dateStr = new Date().toLocaleString();
            doc.text(`Generated on: ${dateStr}`, 14, 30);

            // Better approach: Parse data manually from DOM to ensure clean PDF
            // This ensures we skip the checkbox column and handle formatting correctly
            const headers = ['#', 'Name', 'Phone', 'Address', 'Type', 'Guardian', 'DOB', 'Date', 'Message'];
            const data = [];

            const rows = document.querySelectorAll('#appointments-tbody tr');
            rows.forEach((row) => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) return; // Skip weird rows

                // Skip index 0 (checkbox)
                // 1: Index, 2: Name, 3: Phone, 4: Address, 5: Type, 6: Guardian, 7: DOB, 8: Date, 9: Message

                // Need to extract text safely. Some have nested divs.
                const getText = (cell) => cell ? cell.innerText.trim() : '';

                const rowData = [
                    getText(cells[1]), // #
                    getText(cells[2]), // Name
                    getText(cells[3]), // Phone
                    getText(cells[4]), // Address
                    getText(cells[5]).replace(/\n/g, ', '), // Type (badges)
                    getText(cells[6]).replace(/\n/g, ' '), // Guardian
                    getText(cells[7]), // DOB
                    getText(cells[8]), // Date
                    getText(cells[9])  // Message
                ];
                data.push(rowData);
            });

            doc.autoTable({
                head: [headers],
                body: data,
                startY: 36,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 10 }, // #
                    1: { cellWidth: 25 }, // Name
                    2: { cellWidth: 20 }, // Phone
                    3: { cellWidth: 25 }, // Address
                    8: { cellWidth: 30 }  // Message
                }
            });

            doc.save(`appointments_report_${new Date().toISOString().slice(0, 10)}.pdf`);

        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Failed to generate PDF.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

