/**
 * Premium Scroll Reveal Logic
 * Uses IntersectionObserver to trigger animations when elements enter the viewport.
 */

export function initAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Even if reduced motion is on, we ensure elements are visible, 
    // though CSS handles the transition removal.
    // However, JS adds the class "active" which triggers the state change.

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // Add load class to body just in case CSS animation needs a trigger class
    // (Our CSS uses @keyframes on body directly, so this is just extra safety or for JS hooks)
    document.body.classList.add('loaded');
}
