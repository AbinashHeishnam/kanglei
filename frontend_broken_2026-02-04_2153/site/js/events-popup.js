import { apiGet, toAssetUrl } from './api.js';

/**
 * Initialize event popups for user-facing pages
 * Shows active event posters as modal popups
 */
export async function initEventPopups() {
    try {
        const events = await apiGet('/events');

        if (!events || events.length === 0) {
            console.log('No active events to display');
            return;
        }

        // Filter only active events
        const activeEvents = events.filter(e => e.is_active);

        if (activeEvents.length === 0) {
            console.log('No active events to display');
            return;
        }

        // Show events after a short delay (better UX)
        setTimeout(() => {
            showEventModal(activeEvents);
        }, 1500);

    } catch (err) {
        console.error('Failed to load events:', err);
    }
}

function showEventModal(events) {
    let currentIndex = 0;

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'event-modal';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md transition-opacity duration-300 opacity-0';

    modal.innerHTML = `
        <div class="relative max-w-2xl w-full max-h-[90vh] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-95 border-2 border-white/20 dark:border-white/10">
            <!-- Decorative gradient border effect -->
            <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 pointer-events-none"></div>
            
            <!-- Close Button -->
            <button id="close-event-modal" class="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <!-- Scrollable Content Container -->
            <div class="relative overflow-y-auto max-h-[90vh] custom-scrollbar">
                <!-- Event Image -->
                <div id="event-image-container" class="w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative">
                    <img id="event-image" src="" alt="Event Poster" class="w-full h-auto max-h-[55vh] object-contain mx-auto">
                    
                    <!-- Navigation Arrows (if multiple events) -->
                    <div id="event-nav" class="hidden absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-3 pointer-events-none">
                        <button id="prev-event" class="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/20">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <button id="next-event" class="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/20">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>

                <!-- Event Info -->
                <div class="relative p-5 sm:p-6 bg-gradient-to-t from-white/95 to-white/80 dark:from-slate-900/95 dark:to-slate-900/80 backdrop-blur-sm">
                    <h3 id="event-title" class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3"></h3>
                    <div id="event-dates" class="text-sm text-slate-600 dark:text-slate-400 space-y-1.5"></div>
                    
                    <!-- Navigation Dots (if multiple events) -->
                    <div id="event-dots" class="flex justify-center gap-2 mt-4"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Get elements
    const imageEl = modal.querySelector('#event-image');
    const titleEl = modal.querySelector('#event-title');
    const datesEl = modal.querySelector('#event-dates');
    const dotsContainer = modal.querySelector('#event-dots');
    const navContainer = modal.querySelector('#event-nav');
    const closeBtn = modal.querySelector('#close-event-modal');
    const prevBtn = modal.querySelector('#prev-event');
    const nextBtn = modal.querySelector('#next-event');

    // Show navigation if multiple events
    if (events.length > 1) {
        navContainer.classList.remove('hidden');

        // Create dots
        events.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = `w-2.5 h-2.5 rounded-full transition-all border ${i === 0
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 w-8 border-blue-400/50'
                : 'bg-slate-400/50 dark:bg-slate-600/50 hover:bg-slate-500 dark:hover:bg-slate-500 border-transparent'
                }`;
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        });
    }

    // Update display function
    function updateEvent(index) {
        currentIndex = index;
        const event = events[index];

        imageEl.src = toAssetUrl(event.image_url);
        titleEl.textContent = event.title || 'Event Announcement';

        // Format dates
        let datesHTML = '';
        if (event.starts_at) {
            datesHTML += `<p><strong>Starts:</strong> ${new Date(event.starts_at).toLocaleString()}</p>`;
        }
        if (event.ends_at) {
            datesHTML += `<p><strong>Ends:</strong> ${new Date(event.ends_at).toLocaleString()}</p>`;
        }
        datesEl.innerHTML = datesHTML;

        // Update dots
        if (events.length > 1) {
            dotsContainer.querySelectorAll('button').forEach((dot, i) => {
                if (i === index) {
                    dot.className = 'w-2.5 h-2.5 rounded-full transition-all border bg-gradient-to-r from-blue-500 to-purple-500 w-8 border-blue-400/50';
                } else {
                    dot.className = 'w-2.5 h-2.5 rounded-full transition-all border bg-slate-400/50 dark:bg-slate-600/50 hover:bg-slate-500 dark:hover:bg-slate-500 border-transparent';
                }
            });
        }
    }

    // Event handlers
    closeBtn.addEventListener('click', () => {
        modal.classList.add('opacity-0');
        modal.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => modal.remove(), 300);
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBtn.click();
        }
    });

    // Close on Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeBtn.click();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    if (events.length > 1) {
        prevBtn.addEventListener('click', () => {
            const newIndex = (currentIndex - 1 + events.length) % events.length;
            updateEvent(newIndex);
        });

        nextBtn.addEventListener('click', () => {
            const newIndex = (currentIndex + 1) % events.length;
            updateEvent(newIndex);
        });

        // Dot navigation
        dotsContainer.querySelectorAll('button').forEach(dot => {
            dot.addEventListener('click', () => {
                updateEvent(parseInt(dot.dataset.index));
            });
        });

        // Keyboard navigation
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') prevBtn.click();
            if (e.key === 'ArrowRight') nextBtn.click();
        };
        document.addEventListener('keydown', keyHandler);

        // Clean up on close
        closeBtn.addEventListener('click', () => {
            document.removeEventListener('keydown', keyHandler);
        }, { once: true });
    }

    // Initialize first event
    updateEvent(0);

    // Animate in
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.transform').classList.remove('scale-95');
    });
}
