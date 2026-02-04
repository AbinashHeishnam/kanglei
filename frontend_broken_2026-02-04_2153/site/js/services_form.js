import { apiPost } from './api.js';
import { showToast } from './app.js';

export function initServiceForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> Booking...`;

        // Gather data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const result = await apiPost('/appointments', data);

            showToast(`Appointment booked successfully! ID: ${result.id}`, 'success');
            form.reset();

        } catch (error) {
            console.error(error);
            showToast(error.message || 'Failed to book appointment', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}
