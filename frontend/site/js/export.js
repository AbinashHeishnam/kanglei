
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
    // CSV Export Logic has been moved to admin.js 
    // to strictly pull data from the JS state array (currentlyFiltered)
    // rather than parsing the DOM, in order to guarantee sync with filters and sorts.
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
            const headers = ['#', 'Name', 'Phone', 'Address', 'Type', 'Date', 'Message'];
            const data = [];

            const rows = document.querySelectorAll('#appointments-tbody tr');
            rows.forEach((row) => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) return;

                // Skip index 0 (checkbox)
                // 1: Index, 2: Name, 3: Phone, 4: Address, 5: Type, 6: Date, 7: Message

                const getText = (cell) => cell ? cell.innerText.trim() : '';

                const rowData = [
                    getText(cells[1]), // #
                    getText(cells[2]), // Name
                    getText(cells[3]), // Phone
                    getText(cells[4]), // Address
                    getText(cells[5]).replace(/\n/g, ', '), // Type
                    getText(cells[6]), // Date
                    getText(cells[7])  // Message
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

