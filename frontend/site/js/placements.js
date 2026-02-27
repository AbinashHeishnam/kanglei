import { apiGet, API_ORIGIN } from './api.js';

export async function initPlacements() {
    const section = document.getElementById('placements-section');
    const container = document.getElementById('placements-container');
    const dotsWrap = document.getElementById('pl-dots');
    if (!section || !container) return;

    // ── Skeleton placeholders ──────────────────────────────────────
    container.innerHTML = Array(3)
        .fill('<div class="placement-skeleton"></div>')
        .join('');

    try {
        const data = await apiGet('/placements');

        if (!data || data.length === 0) {
            section.style.display = 'none';
            return;
        }

        // ── Render cards ──────────────────────────────────────────
        container.innerHTML = data.map((item) => {
            const cleanedPath = item.image_path.replace(/^static_uploads\//, '');
            const imageUrl = `${API_ORIGIN}/uploads/${cleanedPath}`;
            return `
            <div class="placement-card">
                <div class="placement-image-wrapper">
                    <img src="${imageUrl}" alt="Student Placement" loading="lazy" />
                </div>
            </div>`;
        }).join('');

        const cards = Array.from(container.querySelectorAll('.placement-card'));

        function cardsPerView() {
            const w = window.innerWidth;
            if (w <= 540) return 1;
            if (w <= 768) return 2;
            return 3;
        }

        const cpv = cardsPerView();
        const pages = Math.ceil(data.length / cpv);

        // ── Centering for single-page views ────────────────────────
        if (pages === 1) {
            container.classList.add('centered');
        } else {
            container.classList.remove('centered');
        }

        // ── Scroll-reveal via IntersectionObserver ────────────────
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const idx = cards.indexOf(card);
                    setTimeout(() => {
                        card.classList.add('pl-visible');
                    }, idx * 100);
                    revealObserver.unobserve(card);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => revealObserver.observe(card));

        // ── Auto-slider (only if multiple pages) ──────────────────────
        if (pages > 1) {
            setupSlider(container, cards, dotsWrap, section);
            if (dotsWrap) dotsWrap.style.display = 'flex';
        } else if (dotsWrap) {
            dotsWrap.style.display = 'none';
        }

    } catch {
        section.style.display = 'none';
    }
}

// ─────────────────────────────────────────────────────────────────
// Auto-slider logic
// ─────────────────────────────────────────────────────────────────
function setupSlider(track, cards, dotsWrap, section) {
    // Figure out how many cards are visible at once based on viewport
    function cardsPerView() {
        const w = window.innerWidth;
        if (w <= 540) return 1;
        if (w <= 768) return 2;
        return 3;
    }

    let current = 0;
    let timer = null;
    let paused = false;

    const total = cards.length;

    // ── Build dots ────────────────────────────────────────────────
    function buildDots() {
        if (!dotsWrap) return;
        const cpv = cardsPerView();
        const pages = Math.ceil(total / cpv);
        dotsWrap.innerHTML = '';
        for (let i = 0; i < pages; i++) {
            const dot = document.createElement('button');
            dot.className = 'pl-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Page ${i + 1}`);
            dot.addEventListener('click', () => goTo(i * cpv));
            dotsWrap.appendChild(dot);
        }
    }

    function updateDots(idx) {
        if (!dotsWrap) return;
        const cpv = cardsPerView();
        const max = Math.max(0, total - cpv);
        let page = Math.floor(idx / cpv);
        if (idx === max && max > 0) {
            page = Math.ceil(total / cpv) - 1;
        }
        const dots = dotsWrap.querySelectorAll('.pl-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === page));
    }

    // ── Translate track ───────────────────────────────────────────
    function goTo(idx) {
        const cpv = cardsPerView();
        const max = Math.max(0, total - cpv);

        // Clamp to valid range and wrap around
        if (idx > max) {
            idx = current < max ? max : 0;
        } else if (idx < 0) {
            idx = current > 0 ? 0 : max;
        }
        current = idx;
        // Calculate exact pixel offset using flex gap from track
        const trackStyle = window.getComputedStyle(track);
        // Extract gap if present, default to 28 based on CSS
        const flexGap = trackStyle.gap ? parseFloat(trackStyle.gap) : 28;

        let offset = 0;
        for (let i = 0; i < idx; i++) {
            if (cards[i]) {
                const style = window.getComputedStyle(cards[i]);
                const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight) || 0;
                offset += cards[i].offsetWidth + margin + flexGap;
            }
        }

        // Edge case: don't overscroll past max width
        const sliderWidth = track.parentElement.offsetWidth;
        const trackTotalWidth = track.scrollWidth;
        const maxScroll = Math.max(0, trackTotalWidth - sliderWidth);

        track.style.transform = `translateX(-${Math.min(offset, maxScroll)}px)`;
        updateDots(current);
    }

    // ── Auto-advance ──────────────────────────────────────────────
    function startTimer() {
        clearInterval(timer);
        if (paused) return;
        timer = setInterval(() => {
            const cpv = cardsPerView();
            goTo(current + cpv);
        }, 4000);
    }

    // ── Pause on hover ────────────────────────────────────────────
    const sliderWrap = track.closest('.placements-slider-wrap') || section;
    sliderWrap.addEventListener('mouseenter', () => {
        paused = true;
        clearInterval(timer);
    });
    sliderWrap.addEventListener('mouseleave', () => {
        paused = false;
        startTimer();
    });

    // ── Touch swipe ───────────────────────────────────────────────
    let touchStartX = null;
    sliderWrap.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        paused = true;
        clearInterval(timer);
    }, { passive: true });
    sliderWrap.addEventListener('touchend', (e) => {
        if (touchStartX === null) return;
        const dx = touchStartX - e.changedTouches[0].clientX;
        const cpv = cardsPerView();
        if (Math.abs(dx) > 40) {
            goTo(dx > 0 ? current + cpv : current - cpv);
        }
        touchStartX = null;
        paused = false;
        startTimer();
    }, { passive: true });

    // ── Rebuild on resize ─────────────────────────────────────────
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            buildDots();
            goTo(0);
            startTimer();
        }, 200);
    });

    // ── Init ──────────────────────────────────────────────────────
    buildDots();
    goTo(0);
    startTimer();
}
