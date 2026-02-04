import { apiPost } from './api.js';

export function initServiceForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Basic Client Validation
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (!data.name || !data.phone || !data.counseling_type) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        try {
            // Adjust payload if needed by backend. 
            // Assuming backend expects { name, phone, type, address, message }
            // API path: /appointments (based on user request)

            const payload = {
                name: data.name,
                phone: data.phone,
                counseling_type: data.counseling_type,
                address: data.address || '',
                message: data.message || ''
            };

            await apiPost('/appointments', payload);

            showToast('Appointment requested successfully!', 'success');
            form.reset();

        } catch (err) {
            console.error('Appointment submit error:', err);
            showToast(err.message || 'Failed to request appointment. Try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });

    // Animate inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('scale-[1.02]');
            input.parentElement.classList.remove('scale-100');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('scale-[1.02]');
            input.parentElement.classList.add('scale-100');
        });
        input.parentElement.classList.add('transition-transform', 'duration-200');
    });
}
