import { apiPost } from './api.js';

export function initServiceForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    // No dynamic country codes anymore, fixed to +91 in HTML

    const phoneInput = form.querySelector('#phone-number');
    const guardianPhoneInput = form.querySelector('#guardian-contact');

    // Strict Phone Validation Helper
    const attachPhoneValidation = (inputEl) => {
        if (!inputEl) return;
        inputEl.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (val.length > 10) val = val.slice(0, 10); // Max 10 digits
            e.target.value = val;
        });
    };

    attachPhoneValidation(phoneInput);
    attachPhoneValidation(guardianPhoneInput);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Hardcode +91 as per new requirement
        const countryCode = '+91';
        const phoneNumber = document.getElementById('phone-number').value;

        // Guardian components
        const guardianPhoneNumber = document.getElementById('guardian-contact')?.value || '';

        // Appointment Types
        const typeCheckboxes = form.querySelectorAll('input[name="appointment_type"]:checked');
        const appointmentTypes = Array.from(typeCheckboxes).map(cb => cb.value);

        // Custom Validation
        if (!data.name || !phoneNumber || !data.guardian_name) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (!data.location) {
            showToast('Please select a branch location.', 'error');
            return;
        }

        if (phoneNumber.length !== 10) {
            showToast('Please enter a valid 10-digit phone number.', 'error');
            document.getElementById('phone-number').focus();
            return;
        }

        // Guardian Validation (if provided)
        if (guardianPhoneNumber && guardianPhoneNumber.length !== 10) {
            showToast('Please enter a valid 10-digit guardian phone number.', 'error');
            document.getElementById('guardian-contact').focus();
            return;
        }

        // Appointment Type Validation
        if (appointmentTypes.length === 0) {
            showToast('Please select at least one Appointment Type.', 'error');
            return;
        }

        const fullPhone = `${countryCode}${phoneNumber}`;
        const fullGuardianPhone = guardianPhoneNumber ? `${countryCode}${guardianPhoneNumber}` : null;

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        try {
            const payload = {
                counseling_type: "General Counseling",
                name: data.name.trim(),
                phone: fullPhone.trim(),
                address: data.address.trim() || null,
                message: data.message.trim() || null,
                location: data.location, // MUST be Imphal or Thoubal
                date_of_birth: data.date_of_birth || null,
                guardian_name: data.guardian_name.trim() || null,
                guardian_contact: fullGuardianPhone || null,
                appointment_type: appointmentTypes.length ? appointmentTypes : null
            };

            const res = await fetch("http://127.0.0.1:8000/api/v1/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error(errorData);
                alert(errorData.detail || "Submission failed");
                return;
            }

            showToast('Appointment requested successfully!', 'success');
            form.reset();

        } catch (err) {
            console.error('Appointment submit error:', err);
            alert('Failed to request appointment. Try again.');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });

    // Animate inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // if (input.id === 'country-code' || input.id === 'guardian-country-code') return;
        // Since we removed the IDs, this check is less necessary but good to clean up if IDs completely gone from DOM
        // Actually, we replaced them with DIVs so they are not inputs anymore, so this selector wont pick them.

        input.addEventListener('focus', () => {
            input.parentElement.classList.add('transition-transform', 'duration-200');
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
