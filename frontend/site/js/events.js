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
    // State
    let allEvents = [];
    let currentIndex = 0;
    let isMenuOpen = false;

    try {
        // 1. Fetch Event Data
        const events = await apiGet('/events');

        // Filter for active events just in case API returns everything
        // (Though API /events usually returns active ones, let's be safe if logic changes)
        allEvents = events ? events.filter(e => e.is_active !== false) : [];

        if (allEvents.length === 0) {
            console.log("No upcoming events found.");
            return;
        }

        // Show trigger button
        triggerBtn.classList.remove('hidden');

        // Render Initial Content
        renderCurrentEvent();

        // 2. Auto-Popup Logic (Check if ANY event in the list is unseen? Or just the latest?)
        // Let's stick to the latest (first one) for the auto-popup trigger to avoid spam.
        // Or specific logic: if the *first* one hasn't been seen.
        const latestEventId = allEvents[0].id;
        const sessionKey = `event_seen_${latestEventId}`;
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
            // Mark latest as seen
            sessionStorage.setItem(sessionKey, 'true');
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeEventPanel();
            }
            // Arrow keys for slider
            if (isMenuOpen && allEvents.length > 1) {
                if (e.key === 'ArrowRight') nextEvent();
                if (e.key === 'ArrowLeft') prevEvent();
            }
        });


    } catch (err) {
        console.error("Failed to initialize events:", err);
        if (triggerBtn) triggerBtn.classList.add('hidden');
    }

    // --- Slider Logic ---
    function renderCurrentEvent() {
        if (allEvents.length === 0) return;
        renderEventContent(allEvents[currentIndex], contentContainer, allEvents.length, currentIndex);

        // Re-attach slider listeners if buttons exist
        const prevBtn = document.getElementById('event-prev-btn');
        const nextBtn = document.getElementById('event-next-btn');

        if (prevBtn) prevBtn.onclick = prevEvent;
        if (nextBtn) nextBtn.onclick = nextEvent;
    }

    function nextEvent() {
        if (allEvents.length <= 1) return;
        currentIndex = (currentIndex + 1) % allEvents.length;
        renderCurrentEvent();
    }

    function prevEvent() {
        if (allEvents.length <= 1) return;
        currentIndex = (currentIndex - 1 + allEvents.length) % allEvents.length;
        renderCurrentEvent();
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

        const rect = triggerBtn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        contentContainer.classList.add('opacity-0');
        overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;

        setTimeout(() => {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 700);
    }
}

function renderEventContent(event, container, total, index) {
    const imageUrl = event.image_url ? toAssetUrl(event.image_url) : null;
    const dateStr = event.date ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Upcoming';

    const location = event.location || "Imphal, Manipur";
    const time = event.time || "10:00 AM";

    // Slider Controls HTML
    const sliderControls = total > 1 ? `
        <div class="flex items-center gap-4 mt-6">
            <button id="event-prev-btn" class="p-2 rounded-full border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <svg class="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
                ${index + 1} / ${total}
            </span>
            <button id="event-next-btn" class="p-2 rounded-full border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <svg class="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        </div>
    ` : '';

    container.innerHTML = `
        <div class="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start h-full overflow-y-auto lg:overflow-visible p-4 lg:p-0">
            
            <!-- Poster / Image Section -->
            <!-- Adjusted for full image visibility without cropping -->
            <div class="${imageUrl ? 'block' : 'hidden lg:block'} relative group w-full flex flex-col items-center">
                <div class="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black/5 dark:bg-slate-800 flex items-center justify-center">
                    ${imageUrl
            ? `<img src="${imageUrl}" alt="${event.title}" class="w-full h-auto max-h-[70vh] object-contain rounded-xl">`
            : `<div class="aspect-[4/5] w-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-gray-400 p-8">
                             <svg class="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                             <span class="text-sm font-medium">Event Poster</span>
                           </div>`
        }
                </div>
                ${sliderControls}
            </div>

            <!-- Content Section -->
            <div class="text-left space-y-6 lg:pt-8 w-full">
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
                        onclick="navigator.share ? navigator.share({title: '${event.title}', text: 'Check out this event!', url: window.location.href}) : showToast('Share Link Copied!', 'success')">
                        Share Event
                    </button>
                    
                     <!-- Mobile Slider Controls (Backup if space is tight) -->
                     ${total > 1 ? `
                     <div class="sm:hidden flex flex-1 justify-end gap-2">
                        <!-- Controls are already below image, but typically image is stacked on top on mobile. 
                             So duplicates might be confusing. Let's rely on the image-section controls. 
                             Or maybe add a hint? -->
                     </div>
                     ` : ''}
                </div>
            </div>
        </div>
    `;
}
