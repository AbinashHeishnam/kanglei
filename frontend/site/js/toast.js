
let toastContainer = null;

function ensureContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'fixed top-24 right-4 z-[100] flex flex-col gap-4 pointer-events-none';
        document.body.appendChild(toastContainer);
    }
}

export function showToast(message, type = 'success') {
    ensureContainer();

    const toast = document.createElement('div');
    toast.className = `premium-toast px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 transform transition-all duration-500 hover:scale-105 cursor-pointer min-w-[320px] pointer-events-auto
        ${type === 'success'
            ? 'bg-white/90 dark:bg-slate-800/90 border-green-500/30 text-slate-800 dark:text-white'
            : type === 'error'
                ? 'bg-white/90 dark:bg-slate-800/90 border-red-500/30 text-slate-800 dark:text-white'
                : 'bg-white/90 dark:bg-slate-800/90 border-blue-500/30 text-slate-800 dark:text-white'
        }`;

    // Icon based on type
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
               <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
           </div>`;
    } else if (type === 'error') {
        iconSvg = `<div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
               <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </div>`;
    } else {
        // Info
        iconSvg = `<div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
               <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           </div>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <div class="flex-1">
            <h4 class="font-bold text-sm uppercase tracking-wide opacity-70 mb-0.5">${type}</h4>
            <p class="font-medium text-sm leading-snug">${message}</p>
        </div>
        <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors close-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Initial State for Animation (Slide in from right)
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });

    const removeToast = () => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 300);
    };

    // Auto-remove
    const timer = setTimeout(removeToast, 4000);

    // Close button
    toast.querySelector('.close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(timer);
        removeToast();
    });

    // Pause on hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => {
        setTimeout(removeToast, 1000);
    });
}
