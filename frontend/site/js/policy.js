/**
 * Policy Modal System for Kanglei Career Solution
 * Version: 1.1.0
 * Handles Terms of Use and Privacy & Refund Policy
 */

const policies = {
    privacy: {
        title: "Privacy & Refund Policy",
        content: `
            <div class="policy-section">
                <p>This Privacy & Refund Policy describes how our platform collects, uses, and protects user information while providing student support and guidance services. By accessing or using our website, users agree to the terms described in this policy.</p>
                
                <p>Our platform is dedicated to supporting students through admission assistance, counselling, psychometric testing, personality development programs, interview preparation, group discussion training, and other educational guidance services. We are committed to maintaining the privacy and security of all users who interact with our platform.</p>
                
                <p>When users submit enquiry forms, register for programs, or contact us through the website, we may collect basic personal information including the user’s name, phone number, and address. This information is collected solely for communication purposes, student guidance, registration processes, counselling support, and service-related assistance.</p>
                
                <p>The information provided by users is handled responsibly and is not sold, rented, or shared with unauthorized third parties. We use collected information only for operational and communication purposes related to our services. We may contact users regarding counselling sessions, admission support, training programs, updates, or other student-related services.</p>
                
                <p>Our platform may also use standard website technologies or analytics tools to improve user experience, website functionality, and service quality. However, we make reasonable efforts to protect all user information from unauthorized access, misuse, or disclosure.</p>
                
                <p>Currently, online payment services are not enabled on this platform. Any payments related to counselling programs, training sessions, admission services, or other educational support programs are handled offline through authorized communication channels or management representatives.</p>
                
                <p>Students or users who make payments for any service may request a refund within seven (7) days from the date of payment or registration. Refund requests submitted after the seven-day period may not be considered eligible for processing. All refund requests are subject to verification, review, and approval by the management team. The platform reserves the right to accept or reject refund requests depending on the nature of the service, registration status, or policy compliance.</p>
                
                <p>Refund processing time may vary depending on the payment method, service type, and administrative procedures. Users are advised to contact the official support team for any refund-related queries or assistance.</p>
                
                <p>By using this website and submitting personal information, users acknowledge and agree to the terms mentioned in this Privacy & Refund Policy.</p>
            </div>
        `
    },
    terms: {
        title: "Terms of Use",
        content: `
            <div class="policy-section">
                <p>Welcome to our student support and educational guidance platform. These Terms of Use govern the access and use of our website and services. By using this platform, users agree to comply with these terms and conditions.</p>
                
                <p>Our platform provides various student-focused services including admission guidance, counselling, psychometric testing, personality development classes, interview preparation programs, group discussion training, and educational awareness support. The purpose of these services is to help students improve their academic, personal, and professional development through proper guidance and mentorship.</p>
                
                <p>Users are expected to provide accurate and genuine information while submitting forms, registering for programs, or communicating with the platform. Any false, misleading, harmful, or inappropriate activity may result in restriction or termination of access to platform services.</p>
                
                <p>Our organization has guided thousands of students through educational counselling, university assistance, skill development programs, and student support initiatives. We strive to provide quality guidance, professional mentorship, and reliable educational assistance to help students make informed decisions regarding their future opportunities.</p>
                
                <p>Although we aim to support students with the best possible guidance and resources, final academic admissions, placements, institutional approvals, or personal outcomes may vary depending on individual eligibility, performance, participation, university requirements, and other external factors beyond the platform’s direct control.</p>
                
                <p>All content available on this website, including text, graphics, logos, training materials, branding elements, and service information, is the intellectual property of the platform and may not be copied, reproduced, modified, or distributed without prior permission.</p>
                
                <p>The platform reserves the right to update, modify, suspend, or discontinue any part of the services, website content, or policies at any time without prior notice. Continued use of the website after such updates constitutes acceptance of the revised terms.</p>
                
                <p>By accessing and using this website, users confirm that they have read, understood, and agreed to these Terms of Use and related policies of the platform.</p>
            </div>
        `
    }
};

export function initPolicies() {
    // 1. Create Modal Container if it doesn't exist
    if (!document.getElementById('policy-modal')) {
        const modal = document.createElement('div');
        modal.id = 'policy-modal';
        modal.className = 'policy-modal-overlay';
        modal.innerHTML = `
            <div class="policy-modal-container">
                <div class="policy-modal-header">
                    <h2 id="policy-modal-title">Policy</h2>
                    <button id="policy-modal-close" class="policy-close-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="policy-modal-body" id="policy-modal-body">
                    <!-- Content injected here -->
                </div>
                <div class="policy-modal-footer">
                    <button class="policy-btn-primary" id="policy-modal-close-bottom">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close logic
        const closeBtn = modal.querySelector('#policy-modal-close');
        const closeBottomBtn = modal.querySelector('#policy-modal-close-bottom');
        
        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };

        closeBtn.onclick = closeModal;
        closeBottomBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    }

    const modal = document.getElementById('policy-modal');
    const titleEl = document.getElementById('policy-modal-title');
    const bodyEl = document.getElementById('policy-modal-body');

    const openPolicy = (type) => {
        const policy = policies[type];
        if (!policy) return;

        titleEl.textContent = policy.title;
        bodyEl.innerHTML = policy.content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Scroll to top of modal body
        bodyEl.scrollTop = 0;
    };

    // 2. Bind to links
    document.addEventListener('click', (e) => {
        const termsLink = e.target.closest('#open-terms');
        const privacyLink = e.target.closest('#open-privacy');
        const termsLink2 = e.target.closest('#open-terms-alt'); // For about.html if needed
        const privacyLink2 = e.target.closest('#open-privacy-alt');

        if (termsLink || termsLink2) {
            e.preventDefault();
            openPolicy('terms');
        } else if (privacyLink || privacyLink2) {
            e.preventDefault();
            openPolicy('privacy');
        }
    });
}
