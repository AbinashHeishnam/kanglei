import { apiPost } from './api.js';

export function initServiceForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const phoneInput = form.querySelector('#phone-number');

    // Phone validation
    const attachPhoneValidation = (inputEl) => {
        if (!inputEl) return;

        inputEl.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 10) val = val.slice(0, 10);
            e.target.value = val;
        });
    };

    attachPhoneValidation(phoneInput);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const countryCode = '+91';
        const phoneNumber = phoneInput.value;

        const typeCheckboxes = form.querySelectorAll(
            'input[name="appointment_type"]:checked'
        );

        const appointmentTypes = Array.from(typeCheckboxes).map(cb => cb.value);

        // ========================
        // Validation
        // ========================

        if (!data.name || !phoneNumber) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (!data.location) {
            showToast('Please select a branch location.', 'error');
            return;
        }

        if (phoneNumber.length !== 10) {
            showToast('Please enter a valid 10-digit phone number.', 'error');
            phoneInput.focus();
            return;
        }

        if (appointmentTypes.length === 0) {
            showToast('Please select at least one Appointment Type.', 'error');
            return;
        }

        const fullPhone = `${countryCode}${phoneNumber}`;

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;

        btn.disabled = true;
        btn.innerHTML = `
        <svg class="animate-spin h-5 w-5 mx-auto text-white"
        xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
            <circle class="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0
            C5.373 0 0 5.373 0 12h4zm2
            5.291A7.962 7.962 0 014
            12H0c0 3.042 1.135 5.824
            3 7.938l3-2.647z"></path>
        </svg>
        `;

        try {

            const payload = {
                counseling_type: "General Counseling",
                name: data.name.trim(),
                phone: fullPhone,
                address: data.address ? data.address.trim() : null,
                message: data.message ? data.message.trim() : null,
                location: data.location,
                date_of_birth: data.date_of_birth || null,

                // Removed fields (backend still supports them)
                guardian_name: "",
                guardian_contact: "",

                appointment_type: appointmentTypes
            };

            // ✅ Use API wrapper instead of fetch
            await apiPost("/appointments", payload, false);

            showToast('Appointment requested successfully!', 'success');

            form.reset();

        } catch (err) {

            console.error('Appointment submit error:', err);

            showToast(
                err.message || 'Submission failed',
                'error'
            );

        } finally {

            btn.disabled = false;
            btn.innerText = originalText;

        }
    });

    // ========================
    // Input animation
    // ========================

    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {

        input.addEventListener('focus', () => {
            input.parentElement.classList.add(
                'transition-transform',
                'duration-200'
            );

            if (!input.parentElement.classList.contains('gap-2')) {
                input.parentElement.classList.add('scale-[1.02]');
            }
        });

        input.addEventListener('blur', () => {
            if (!input.parentElement.classList.contains('gap-2')) {
                input.parentElement.classList.remove('scale-[1.02]');
            }
        });

    });
}