
let confirmContainer = null;

function ensureContainer() {
    if (!confirmContainer) {
        confirmContainer = document.createElement('div');
        confirmContainer.id = 'custom-confirm-modal';
        confirmContainer.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300';
        confirmContainer.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 max-w-sm w-full p-6 transform scale-95 transition-transform duration-300">
                <div class="flex flex-col items-center text-center">
                    <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm Action</h3>
                    <p id="confirm-message" class="text-gray-600 dark:text-slate-400 text-sm mb-6">Are you sure you want to proceed?</p>
                    <div class="flex gap-3 w-full">
                        <button id="confirm-cancel" class="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            Cancel
                        </button>
                        <button id="confirm-ok" class="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmContainer);
    }
    return confirmContainer;
}

export function showConfirm(message, confirmText = 'Confirm') {
    return new Promise((resolve) => {
        const container = ensureContainer();
        const msgEl = container.querySelector('#confirm-message');
        const cancelBtn = container.querySelector('#confirm-cancel');
        const okBtn = container.querySelector('#confirm-ok');
        const modalBody = container.firstElementChild;

        msgEl.textContent = message;
        okBtn.textContent = confirmText;

        // Open
        container.classList.remove('pointer-events-none', 'opacity-0');
        modalBody.classList.remove('scale-95');
        modalBody.classList.add('scale-100');

        const close = (result) => {
            container.classList.add('opacity-0', 'pointer-events-none');
            modalBody.classList.remove('scale-100');
            modalBody.classList.add('scale-95');
            resolve(result);
        };

        // One-time listeners
        const handleCancel = () => {
            cleanup();
            close(false);
        };
        const handleOk = () => {
            cleanup();
            close(true);
        };

        const cleanup = () => {
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
        };

        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleOk);
    });
}
