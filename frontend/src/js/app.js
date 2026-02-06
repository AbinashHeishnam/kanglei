document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavbar();
    initScrollReveal();
    initPageLoader(); // New loader logic
});

// Theme Management with Smooth Transitions
function initTheme() {
    const themeToggles = document.querySelectorAll("[data-theme-toggle]");
    const root = document.documentElement;

    function setTheme(theme, withTransition = false) {
        // Add transition class for smooth theme switching
        if (withTransition) {
            root.classList.add('theme-transitioning');
        }

        if (theme === "dark") {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }

        // Remove transition class after animation completes
        if (withTransition) {
            setTimeout(() => {
                root.classList.remove('theme-transitioning');
            }, 500); // Match CSS transition duration
        }
    }

    // Init on load (no transition on initial load)
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        setTheme(savedTheme, false);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark", false);
    }

    themeToggles.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const isDark = root.classList.contains("dark");
            setTheme(isDark ? "light" : "dark", true); // Enable transition on user toggle
        });
    });
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
                entry.target.classList.add('animate-slide-up');
                entry.target.classList.remove('opacity-0', 'translate-y-4');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('opacity-0', 'translate-y-4', 'transition-all', 'duration-700');
        observer.observe(el);
    });
}

// Toast Utility (Premium Glassmorphism)
export function showToast(message, type = 'success') {
    // Remove existing toasts to prevent stacking overload
    const existing = document.querySelector('.premium-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `premium-toast fixed top-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 z-50 transform transition-all duration-500 hover:scale-105 cursor-pointer min-w-[320px] sm:min-w-[400px]
        ${type === 'success'
            ? 'bg-white/90 dark:bg-slate-800/90 border-green-500/30 text-slate-800 dark:text-white'
            : 'bg-white/90 dark:bg-slate-800/90 border-red-500/30 text-slate-800 dark:text-white'
        }`;

    // Icon based on type
    const icon = type === 'success'
        ? `<div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
               <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
           </div>`
        : `<div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
               <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </div>`;

    toast.innerHTML = `
        ${icon}
        <div class="flex-1">
            <h4 class="font-bold text-sm uppercase tracking-wide opacity-70 mb-0.5">${type}</h4>
            <p class="font-medium text-sm leading-snug">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `;

    document.body.appendChild(toast);

    // Animation: Slide down from top
    toast.style.transform = 'translate(-50%, -20px)';
    toast.style.opacity = '0';

    requestAnimationFrame(() => {
        toast.style.transform = 'translate(-50%, 0)';
        toast.style.opacity = '1';
    });

    // Auto-remove
    const timer = setTimeout(() => {
        removeToast(toast);
    }, 4000);

    // Pause on hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => {
        setTimeout(() => removeToast(toast), 1000);
    });
}

function removeToast(el) {
    if (!el) return;
    el.style.transform = 'translate(-50%, -20px)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
}

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
            loader.classList.add('pointer-events-none');
            // Also fade in body content
            document.body.classList.remove('opacity-0');
            document.body.classList.add('opacity-100');
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
            loader.classList.remove('pointer-events-none');
            loader.classList.remove('opacity-0');

            // Wait then Navigate
            setTimeout(() => {
                window.location.href = href;
            }, 600); // 600ms transition time
        });
    });
}

// Override Native Alert with Premium Toast
window.alert = (message) => showToast(message, 'info'); // 'info' falls back to default style or red if error
window.showToast = showToast; // Expose globally
