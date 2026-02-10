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
    let slideWidth = container.getBoundingClientRect().width;

    // 1. Render Slider Track + Internal Controls
    container.innerHTML = `
        <div class="relative w-full h-full overflow-hidden group">
            <!-- Track -->
            <div id="slider-track" class="flex flex-nowrap h-full will-change-transform" style="transition: transform 500ms ease;">
                ${images.map((img, i) => `
                    <div class="w-full h-full flex-none relative bg-black flex items-center justify-center overflow-hidden" style="flex: 0 0 100%; min-width: 100%;">
                        <img 
                            src="${toAssetUrl(img.image_url)}" 
                            alt="${img.caption || ''}" 
                            class="block w-full h-full object-cover object-center opacity-0 transition-opacity duration-500 ease-in-out"
                            onload="this.classList.remove('opacity-0')"
                            draggable="false"
                        >
                        
                        <!-- Caption Overlay (Bottom) -->
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 sm:p-10 pt-20 flex flex-col justify-end items-start pointer-events-none">
                            <h3 class="text-white text-lg sm:text-2xl font-bold mb-1 opacity-90 drop-shadow-md border-l-4 border-blue-500 pl-3">
                                ${img.title || 'Kanglei Gallery'}
                            </h3>
                            ${img.caption ? `<p class="text-gray-200 text-sm sm:text-base line-clamp-2 max-w-2xl pl-3">${img.caption}</p>` : ''}
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
        track.style.transform = `translateX(-${index * slideWidth}px)`;

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
        if (timer) clearInterval(timer);
        timer = setInterval(nextSlide, 3500);
    }

    function stopAutoplay() {
        clearInterval(timer);
    }

    // Handle Resize
    window.addEventListener('resize', () => {
        slideWidth = container.getBoundingClientRect().width;
        // Temporarily disable transition for instant resize sync
        track.style.transition = 'none';
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        // Restore transition
        setTimeout(() => {
            track.style.transition = 'transform 500ms ease';
        }, 50);
    });

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
