import { apiGet, toAssetUrl } from './api.js';

const SESSION_KEY = 'event_popup_closed';
let events = [];
let currentEventIndex = 0;

/**
 * Initialize event overlay system
 * Shows popup once per session, then shows bubble button
 */
export async function initEventOverlay() {
    try {
        // Fetch active events
        events = await apiGet('/events');

        if (!events || events.length === 0) {
            // No events - hide everything
            hideBubble();
            hideOverlay();
            return;
        }

        // Check if popup was already closed this session
        const popupClosed = sessionStorage.getItem(SESSION_KEY);

        if (!popupClosed) {
            // First visit - show popup after delay
            setTimeout(() => {
                showInitialPopup();
            }, 1500);
        } else {
            // Already closed - just show bubble
            showBubble();
        }

        // Setup event listeners
        setupEventListeners();

    } catch (err) {
        console.error('Failed to load events:', err);
    }
}

/**
 * Show initial popup (first visit in session)
 */
function showInitialPopup() {
    const overlay = document.getElementById('eventOverlay');
    if (!overlay) return;

    renderEventContent();
    overlay.classList.remove('hidden');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

/**
 * Show floating bubble button
 */
function showBubble() {
    const bubble = document.getElementById('eventBubble');
    if (bubble) {
        bubble.classList.remove('hidden');
    }
}

/**
 * Hide bubble button
 */
function hideBubble() {
    const bubble = document.getElementById('eventBubble');
    if (bubble) {
        bubble.classList.add('hidden');
    }
}

/**
 * Hide overlay
 */
function hideOverlay() {
    const overlay = document.getElementById('eventOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('open');
    }
}

/**
 * Open overlay with circle expansion animation
 */
function openOverlay() {
    const overlay = document.getElementById('eventOverlay');
    const bubble = document.getElementById('eventBubble');
    // revealCircle is no longer needed/used with clip-path approach

    if (!overlay || !bubble) return;

    // Get bubble position for animation origin
    const bubbleRect = bubble.getBoundingClientRect();
    const centerX = bubbleRect.left + bubbleRect.width / 2;
    const centerY = bubbleRect.top + bubbleRect.height / 2;

    // Set CSS custom properties for circle position
    document.documentElement.style.setProperty('--bubble-x', `${centerX}px`);
    document.documentElement.style.setProperty('--bubble-y', `${centerY}px`);

    // Render content
    renderEventContent();

    // Hide bubble, show overlay
    bubble.classList.add('hidden');

    // We don't need to remove 'hidden' class from overlay because it's managed via clip-path/opacity now
    // But for safety against legacy 'hidden' class if present:
    overlay.classList.remove('hidden');

    // Trigger animation
    requestAnimationFrame(() => {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    });
}

/**
 * Close overlay with reverse animation
 */
function closeOverlay() {
    const overlay = document.getElementById('eventOverlay');

    if (!overlay) return;

    // Mark as closed in session
    sessionStorage.setItem(SESSION_KEY, 'true');

    // Trigger closing animation
    overlay.classList.add('closing');
    overlay.classList.remove('open');

    // Wait for animation to complete
    setTimeout(() => {
        overlay.classList.remove('closing');
        overlay.classList.remove('open'); // Ensure open is gone
        // We don't add 'hidden' anymore to avoid display conflicts, purely visual toggle
        document.body.style.overflow = '';

        // Show bubble
        showBubble();
    }, 600); // Increased to 600ms to match clip-path transition
}

/**
 * Render event content in overlay
 */
function renderEventContent() {
    const contentEl = document.getElementById('eventContent');
    if (!contentEl) return;

    if (events.length === 0) {
        contentEl.innerHTML = '<p class="text-slate-400">No events available</p>';
        return;
    }

    const event = events[currentEventIndex];

    contentEl.innerHTML = `
        <div class="relative w-full max-h-[80vh] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20 dark:border-white/10 mx-auto max-w-2xl">
            <!-- Decorative gradient border effect -->
            <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 pointer-events-none"></div>

            <div class="relative overflow-y-auto max-h-[80vh] custom-scrollbar">
                <!-- Event Image -->
                <div class="w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative">
                    <img src="${toAssetUrl(event.image_url)}" alt="${event.title || 'Event Poster'}" class="w-full h-auto max-h-[55vh] object-contain mx-auto">
                    
                    <!-- Navigation Arrows for Overlay -->
                    ${events.length > 1 ? `
                    <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-3 pointer-events-none">
                        <button id="prevEvent" class="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/20">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <button id="nextEvent" class="pointer-events-auto w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/20">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- Event Info -->
                <div class="relative p-5 sm:p-6 bg-gradient-to-t from-white/95 to-white/80 dark:from-slate-900/95 dark:to-slate-900/80 backdrop-blur-sm">
                    ${event.title ? `<h3 class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3 text-center">${event.title}</h3>` : ''}
                    
                    ${event.starts_at || event.ends_at ? `
                        <div class="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 text-center">
                            ${event.starts_at ? `<p><strong>Starts:</strong> ${new Date(event.starts_at).toLocaleString()}</p>` : ''}
                            ${event.ends_at ? `<p><strong>Ends:</strong> ${new Date(event.ends_at).toLocaleString()}</p>` : ''}
                        </div>
                    ` : ''}

                    <!-- Navigation Dots -->
                    ${events.length > 1 ? `
                    <div class="flex justify-center gap-2 mt-4 event-dots">
                        ${events.map((_, i) => `
                            <button class="w-2.5 h-2.5 rounded-full transition-all border ${i === currentEventIndex
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 w-8 border-blue-400/50'
            : 'bg-slate-400/50 dark:bg-slate-600/50 hover:bg-slate-500 dark:hover:bg-slate-500 border-transparent'
        }" data-index="${i}"></button>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    // Setup navigation if multiple events
    if (events.length > 1) {
        setupNavigation();
    }
}

/**
 * Setup navigation for multiple events
 */
function setupNavigation() {
    const prevBtn = document.getElementById('prevEvent');
    const nextBtn = document.getElementById('nextEvent');
    const dots = document.querySelectorAll('.event-dot');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentEventIndex > 0) {
                currentEventIndex--;
                renderEventContent();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentEventIndex < events.length - 1) {
                currentEventIndex++;
                renderEventContent();
            }
        });
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            currentEventIndex = parseInt(dot.dataset.index);
            renderEventContent();
        });
    });

    // Keyboard navigation
    const keyHandler = (e) => {
        if (e.key === 'ArrowLeft' && currentEventIndex > 0) {
            currentEventIndex--;
            renderEventContent();
        } else if (e.key === 'ArrowRight' && currentEventIndex < events.length - 1) {
            currentEventIndex++;
            renderEventContent();
        }
    };

    document.addEventListener('keydown', keyHandler);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const bubble = document.getElementById('eventBubble');
    const closeBtn = document.getElementById('eventClose');
    const overlay = document.getElementById('eventOverlay');

    // Bubble click - open overlay
    if (bubble) {
        bubble.addEventListener('click', openOverlay);
    }

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOverlay);
    }

    // Close on backdrop click
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeOverlay();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
            closeOverlay();
        }
    });
}
