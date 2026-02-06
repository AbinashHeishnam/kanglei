document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavbar();
    initScrollReveal();
    initPageLoader(); // New loader logic
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
        loader.className = 'fixed inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-500 pointer-events-none';
        loader.innerHTML = `
            <div class="relative flex flex-col items-center">
                <!-- Outer Ring -->
                <div class="w-16 h-16 rounded-full border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
                <!-- Inner Pulse -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600/20 dark:bg-blue-400/20 rounded-full animate-pulse"></div>
                <!-- Logo/Brand (Optional) -->
                <div class="absolute -bottom-12 text-sm font-bold tracking-widest text-slate-800 dark:text-white uppercase opacity-80 animate-pulse">
                    Loading
                </div>
            </div>
        `;
        document.body.prepend(loader);
    }

    const loader = document.getElementById('global-loader');

    // 2. Hide Loader on Load (Fade Out)
    // Wait a tiny bit for smooth "arrival" feel
    requestAnimationFrame(() => {
        setTimeout(() => {
            loader.classList.add('opacity-0');
            loader.classList.add('opacity-0');
            // Enforce non-blocking interaction
            loader.classList.add('pointer-events-none');
            // Also fade in body content
            document.body.classList.remove('opacity-0');
            document.body.classList.add('opacity-100');

            // Backup safety: remove loader from DOM after transition to prevent z-index issues
            setTimeout(() => {
                // We don't remove it because we need it for page exit animation.
                // But we can hide it.
                loader.style.zIndex = '-1';
            }, 500);
        }, 300); // 300ms initial hold
    });

    // 3. Intercept Links for "Leaving" Animation
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');

            // Ignore external, anchors, or special links
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || target === '_blank') return;

            // Check if same page
            if (href === window.location.pathname || href === window.location.href) return;

            e.preventDefault();

            // Show Loader
            loader.style.zIndex = '100';
            loader.classList.remove('pointer-events-none');
            loader.classList.remove('opacity-0');

            // Wait then Navigate
            setTimeout(() => {
                window.location.href = href;
            }, 600); // 600ms transition time

            // Safety Circuit Breaker: If page doesn't unload in 5s (e.g. download, error, or cancelled), hide loader
            setTimeout(() => {
                loader.classList.add('opacity-0');
                loader.classList.add('pointer-events-none');
                setTimeout(() => { loader.style.zIndex = '-1'; }, 500);
            }, 5000);
        });
    });
}

