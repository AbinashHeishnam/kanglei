import { apiGet, toAssetUrl } from './api.js';

/**
 * Premium Event Notification System
 * Handles auto-popup, floating trigger, and radial spread animation.
 */

export async function initEvents() {
    const triggerBtn = document.getElementById('eventTrigger');
    const overlay = document.getElementById('eventOverlay');
    const closeBtn = document.getElementById('eventClose');
    const contentContainer = document.getElementById('eventContent');

    if (!triggerBtn || !overlay) return;

    // State
    let currentEvent = null;
    let isMenuOpen = false;

    try {
        // 1. Fetch Event Data
        // Ideally: /api/v1/events/upcoming
        // For development/testing: We might get a list and pick the first active one.
        const events = await apiGet('/events');

        // Use the first active event (mock logic if needed)
        // const upcomingEvent = events?.find(e => e.is_active !== false);
        const upcomingEvent = events && events.length > 0 ? events[0] : null;

        if (!upcomingEvent) {
            console.log("No upcoming events found.");
            return;
        }

        currentEvent = upcomingEvent;

        // Show trigger button
        triggerBtn.classList.remove('hidden');

        // Render Content immediately so it's ready
        renderEventContent(currentEvent, contentContainer);

        // 2. Auto-Popup Logic
        const sessionKey = `event_seen_${currentEvent.id}`;
        const hasSeen = sessionStorage.getItem(sessionKey);

        if (!hasSeen) {
            // Auto-open after delay
            setTimeout(() => {
                openEventPanel();
            }, 2000);
        }

        // 3. Event Listeners
        triggerBtn.addEventListener('click', () => {
            openEventPanel();
        });

        closeBtn.addEventListener('click', () => {
            closeEventPanel();
            // Mark as seen on close
            sessionStorage.setItem(sessionKey, 'true');
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeEventPanel();
            }
        });


    } catch (err) {
        console.error("Failed to initialize events:", err);
        // Ensure UI stays hidden on error
        if (triggerBtn) triggerBtn.classList.add('hidden');
    }

    // --- Animation Logic ---

    function openEventPanel() {
        if (isMenuOpen) return;
        isMenuOpen = true;

        // Get trigger center position for accurate radial origin
        const rect = triggerBtn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Set origin dynamically
        overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;
        overlay.classList.remove('hidden');

        // Trigger reflow
        overlay.offsetHeight;

        // Expand
        overlay.style.clipPath = `circle(150% at ${x}px ${y}px)`; // 150% covers full screen

        // Fade in content
        contentContainer.classList.remove('opacity-0');

        // Hide scrolling
        document.body.style.overflow = 'hidden';
    }

    function closeEventPanel() {
        if (!isMenuOpen) return;
        isMenuOpen = false;

        // Get trigger center position
        const rect = triggerBtn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Content fade out first
        contentContainer.classList.add('opacity-0');

        // Collapse animation
        overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;

        // Wait for transition to finish before hiding
        setTimeout(() => {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 700); // Match CSS duration
    }
}

function renderEventContent(event, container) {
    const imageUrl = event.image_url ? toAssetUrl(event.image_url) : null;
    const dateStr = event.date ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Upcoming';

    // Note: API might vary, adapting fields based on typical KCS usage we've seen
    const location = event.location || "Imphal, Manipur";
    const time = event.time || "10:00 AM";

    container.innerHTML = `
        <div class="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            <!-- Poster / Image Section -->
            <div class="${imageUrl ? 'block' : 'hidden lg:block'} relative group">
                <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div class="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800 aspect-[4/5] or aspect-video flex items-center justify-center">
                    ${imageUrl
            ? `<img src="${imageUrl}" alt="${event.title}" class="w-full h-full object-cover">`
            : `<div class="p-8 text-center text-gray-400">
                             <svg class="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                             <span class="text-sm font-medium">Event Poster</span>
                           </div>`
        }
                </div>
            </div>

            <!-- Content Section -->
            <div class="text-left space-y-6">
                <!-- Badge -->
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide uppercase">
                    <svg class="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
                    Upcoming Event
                </div>

                <!-- Title -->
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-gray-900 dark:text-white leading-tight">
                    ${event.title}
                </h2>

                <!-- Meta Info -->
                <div class="flex flex-wrap gap-6 text-gray-600 dark:text-slate-300 border-y border-gray-100 dark:border-slate-800 py-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Date</p>
                            <p class="font-medium">${dateStr}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-pink-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Time</p>
                            <p class="font-medium">${time}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 w-full sm:w-auto">
                        <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Location</p>
                            <p class="font-medium">${location}</p>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="prose prose-lg dark:prose-invert text-gray-600 dark:text-slate-300 max-w-none">
                    <p>${event.description || "Join us for this exclusive career event featuring top industry experts."}</p>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-4 pt-4">
                    ${event.link ? `
                    <a href="${event.link}" target="_blank" 
                       class="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 transition-all text-center">
                        Register Now
                    </a>` : ''}
                    
                    <button class="px-8 py-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-semibold text-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        onclick="navigator.share ? navigator.share({title: '${event.title}', text: 'Check out this event!', url: window.location.href}) : alert('Share Link Copied!')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 110-2.684m0 8.368a3 3 0 110-2.684"></path></svg>
                        Share Event
                    </button>
                </div>
            </div>
        </div>
    `;
}
