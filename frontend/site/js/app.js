document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavbar();
    initScrollReveal();
    initPageLoader(); // New loader logic
    initPageTransitions(); // Intercept page jumps
});

// Theme Management with Smooth Transitions
// Theme Management (Enforced Light Mode)
function initTheme() {
    const root = document.documentElement;

    // Always enforce light mode
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    // Remove toggle buttons if they exist
    const themeToggles = document.querySelectorAll("[data-theme-toggle]");
    themeToggles.forEach(btn => btn.remove());
}

// Navbar & Mobile Menu
function initNavbar() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const navbar = document.querySelector('header');

    if (mobileMenuBtn && mobileMenu) {
        const closeMenu = () => {
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('keydown', handleEscape);
            }
        };

        const handleClickOutside = (e) => {
            if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                closeMenu();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeMenu();
            }
        };

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = mobileMenu.classList.toggle('hidden');
            if (!isHidden) {
                document.addEventListener('click', handleClickOutside);
                document.addEventListener('keydown', handleEscape);
            } else {
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('keydown', handleEscape);
            }
        });

        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // Sticky Navbar Shadow
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navbar.classList.add('shadow-md', 'backdrop-blur-xl', 'bg-white/90', 'dark:bg-gray-900/90');
        } else {
            navbar.classList.remove('shadow-md', 'backdrop-blur-xl', 'bg-white/90', 'dark:bg-gray-900/90');
        }
    });
}

// Scroll Reveal
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

// Toast Utility (Premium Glassmorphism)
// Toast Utility (Imported)
import { showToast } from './toast.js';

// Override Native Alert with Premium Toast
window.alert = (message) => showToast(message, 'info');
window.showToast = showToast; // Expose globally for inline calls

// Page Loader & Transitions
function initPageLoader() {
    // 1. Ensure Loader HTML exists
    if (!document.getElementById('global-loader')) {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 z-[99999] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-700 pointer-events-none opacity-0';

        // Premium minimal ring and glow design
        loader.innerHTML = `
            <div class="relative flex flex-col items-center justify-center transform scale-95 transition-transform duration-700" id="global-loader-inner">
                <!-- Outer glowing ring -->
                <div class="absolute inset-0 rounded-full w-20 h-20 -left-2 -top-2 bg-emerald-500/20 blur-xl animate-pulse"></div>
                <div class="absolute inset-0 rounded-full w-20 h-20 -left-2 -top-2 bg-blue-500/20 blur-xl animate-pulse delay-150"></div>
                
                <!-- Main Spinner -->
                <svg class="w-16 h-16 animate-spin text-emerald-600 dark:text-emerald-400" viewBox="0 0 50 50">
                    <circle class="opacity-20" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-90" fill="currentColor" d="M25 5 Q 35 5 39 10 L 41 8 Q 36 2 25 1 L 25 5 Z"></path>
                    <path class="opacity-90" fill="currentColor" d="M25 1 L 25 5 A 20 20 0 0 1 45 25 L 49 25 A 24 24 0 0 0 25 1 Z"></path>
                </svg>

                <!-- Status Text -->
                <div class="absolute -bottom-14 text-[11px] font-bold tracking-[0.2em] text-slate-800 dark:text-white uppercase transition-opacity duration-500" id="global-loader-text">
                    <span class="animate-pulse">Loading</span>
                </div>
            </div>
        `;
        document.body.prepend(loader);
    }

    const loader = document.getElementById('global-loader');
    const inner = document.getElementById('global-loader-inner');

    // Make sure body content is ready
    document.body.classList.remove('opacity-0');
    document.body.classList.add('opacity-100');

    // If loader was actively shown (e.g. from a page transition), hide it smoothly
    if (loader.classList.contains('active-loader')) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                loader.classList.remove('opacity-100', 'active-loader');
                loader.classList.add('opacity-0', 'pointer-events-none');
                if (inner) inner.style.transform = 'scale(1.05)'; // Expand out slightly

                setTimeout(() => {
                    loader.style.zIndex = '-1';
                }, 700);
            }, 100);
        });
    }
}

// Intercept clicks on links for smooth exit transitions
function initPageTransitions() {
    document.addEventListener('click', (e) => {
        // Find closest A tag
        const link = e.target.closest('a');
        if (!link) return;

        // Ignore links without hrefs, anchor links (#), or external target="_blank"
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || link.target === '_blank') return;

        // Ignore javascript:, mailto:, tel:
        if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        // Internal domain check
        if (link.hostname !== window.location.hostname && link.hostname !== '') return;

        // Ignore if Ctrl/Cmd/Shift is pressed (opening in new tab)
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;

        // Skip if same page (e.g href="/about" while currently on /about)
        if (link.pathname === window.location.pathname && link.search === window.location.search) return;

        e.preventDefault();

        // 1. Show the loader
        const loader = document.getElementById('global-loader');
        const inner = document.getElementById('global-loader-inner');

        if (loader) {
            loader.style.zIndex = '99999';
            loader.classList.remove('opacity-0', 'pointer-events-none');
            loader.classList.add('opacity-100', 'active-loader'); // Active flag tells next page it was a smooth transition

            if (inner) inner.style.transform = 'scale(1)'; // Snap to perfect size
        }

        // 2. Wait for animation, then navigate
        setTimeout(() => {
            window.location.href = href;
        }, 400); // 400ms gives time for the elegant fade in
    });
}

