import { API_BASE, toAssetUrl, apiGet } from './api.js';

export async function initSlider(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show shimmer placeholder
    container.innerHTML = `<div class="w-full h-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>`;

    try {
        const gallery = await apiGet('/gallery');

        if (gallery.length === 0) {
            // Empty state for full screen
            container.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md">
                    <div class="text-center p-8">
                        <svg class="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <p class="text-slate-500 text-sm font-medium">Gallery empty.</p>
                    </div>
                </div>
            `;
            return;
        }

        renderSlider(container, gallery);

    } catch (err) {
        console.error("Failed to load gallery:", err);
        container.innerHTML = `<div class="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-red-400 text-sm">Failed to load.</div>`;
    }
}

function renderSlider(container, images) {
    let currentIndex = 0;
    let timer;

    // 1. Render Slider Track + Internal Controls
    container.innerHTML = `
        <div class="relative w-full h-full overflow-hidden group lg:rounded-md">
            <!-- Track -->
            <div id="slider-track" class="flex h-full transition-transform duration-700 ease-in-out will-change-transform">
                ${images.map(img => `
                    <div class="min-w-full h-full flex-shrink-0 relative bg-slate-900">
                        <img 
                            src="${toAssetUrl(img.image_url)}" 
                            alt="${img.caption || ''}" 
                            class="w-full h-full object-contain lg:object-cover object-center select-none transition-all duration-500"
                            decoding="async"
                            loading="eager"
                            draggable="false"
                        >
                        
                        <!-- Caption Overlay -->
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16 flex justify-between items-end">
                            <p class="text-white text-sm sm:text-base font-medium line-clamp-2 max-w-[85%] text-shadow-sm leading-snug">
                                ${img.caption || ''}
                            </p>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Internal Dots (Bottom Right) -->
            <div class="absolute bottom-4 right-4 flex gap-1.5 z-10">
                ${images.map((_, i) => `
                    <button data-index="${i}" class="slider-dot w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? 'bg-white w-4' : 'bg-white/50 hover:bg-white'} shadow-sm backdrop-blur-sm"></button>
                `).join('')}
            </div>
        </div>
    `;

    const track = container.querySelector('#slider-track');
    const dots = container.querySelectorAll('.slider-dot');

    function updateSlide(index) {
        currentIndex = index;
        track.style.transform = `translateX(-${index * 100}%)`;

        // Update Dots
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.remove('bg-white/50', 'hover:bg-white');
                dot.classList.add('bg-white', 'w-4');
            } else {
                dot.classList.add('bg-white/50', 'hover:bg-white');
                dot.classList.remove('bg-white', 'w-4');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % images.length;
        updateSlide(currentIndex);
    }

    function startAutoplay() {
        timer = setInterval(nextSlide, 3500);
    }

    function stopAutoplay() {
        clearInterval(timer);
    }

    startAutoplay();

    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);

    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            stopAutoplay();
            updateSlide(parseInt(e.target.dataset.index));
            startAutoplay();
        });
    });

    // Touch Support
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });

    container.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    }, { passive: true });

    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            nextSlide();
        }
        if (touchEndX > touchStartX + 50) {
            let prevIndex = (currentIndex - 1 + images.length) % images.length;
            updateSlide(prevIndex);
        }
    }
}
