import { apiPost } from './api.js';

export function initServiceForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Populate Country Codes
    const countrySelect = form.querySelector('#country-code');
    const phoneInput = form.querySelector('#phone-number');

    if (countrySelect) {
        const countryCodes = [
            { code: "+91", country: "India" },
            { code: "+1", country: "USA/Canada" },
            { code: "+44", country: "UK" },
            { code: "+61", country: "Australia" },
            { code: "+81", country: "Japan" },
            { code: "+49", country: "Germany" },
            { code: "+33", country: "France" },
            { code: "+86", country: "China" },
            { code: "+971", country: "UAE" },
            { code: "+65", country: "Singapore" },
            { code: "+60", country: "Malaysia" },
            { code: "+66", country: "Thailand" },
            { code: "+880", country: "Bangladesh" },
            { code: "+977", country: "Nepal" },
            { code: "+95", country: "Myanmar" },
            { code: "+94", country: "Sri Lanka" },
            { code: "+92", country: "Pakistan" }
        ];

        // Clear existing options (keep default +91 if desired or rebuild)
        countrySelect.innerHTML = '';
        countryCodes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.code;
            option.textContent = `${c.code} (${c.country})`; // Simplified format
            if (c.code === '+91') option.selected = true;
            countrySelect.appendChild(option);
        });
    }

    // Strict Phone Validation
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (val.length > 10) val = val.slice(0, 10); // Max 10 digits
            e.target.value = val;
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Get phone components directly by ID to be safe
        const countryCode = document.getElementById('country-code').value;
        const phoneNumber = document.getElementById('phone-number').value;

        // Custom Validation
        if (!data.name || !phoneNumber || !data.counseling_type) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (phoneNumber.length !== 10) {
            showToast('Please enter a valid 10-digit phone number.', 'error');
            document.getElementById('phone-number').focus();
            return;
        }

        const fullPhone = `${countryCode}${phoneNumber}`;

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        try {
            const payload = {
                name: data.name,
                phone: fullPhone, // Use the combined phone number
                counseling_type: data.counseling_type,
                address: data.address || '',
                message: data.message || ''
            };

            await apiPost('/appointments', payload);

            showToast('Appointment requested successfully!', 'success');
            form.reset();
            // Reset country code safely
            if (countrySelect) countrySelect.value = "+91";


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
        if (input.id === 'country-code') return; // Skip scale effect on select if overly glitchy, or adjust logic.
        // Actually the scale effect on parent might be tricky with the flex group. 
        // Let's safe-guard against 'null' parent or similar. 
        // For the phone group, the immediate parent is the flex div, not the label container.

        input.addEventListener('focus', () => {
            // Logic to find the "card-like" parent wrapper if relevant, OR 
            // just keep existing logic if it works okay. 
            // Existing logic: input.parentElement.classList.add(...)
            // For phone group: parent is flex-row. Scaling flex-row might be fine.
            input.parentElement.classList.add('transition-transform', 'duration-200');
            if (!input.parentElement.classList.contains('gap-2')) { // simplistic check to avoid double scaling the flex group?
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
