document.addEventListener("DOMContentLoaded", () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;

                // Handle delay
                const delay = el.getAttribute('data-delay');
                if (delay) {
                    el.style.transitionDelay = `${delay}ms`;
                }

                el.classList.add('is-visible');
                observer.unobserve(el); // Only run once
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));
});
