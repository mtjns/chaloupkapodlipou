// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');
const line1 = document.getElementById('line1');
const line2 = document.getElementById('line2');
const line3 = document.getElementById('line3');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('hidden');
        line1.classList.toggle('rotate-45');
        line1.classList.toggle('translate-y-2');
        line2.classList.toggle('opacity-0');
        line3.classList.toggle('-rotate-45');
        line3.classList.toggle('-translate-y-2');
    });
}

// Close mobile menu when links are clicked
if (mobileNav) {
    const mobileLinks = document.querySelectorAll('#mobile-nav a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.add('hidden');
            line1.classList.remove('rotate-45', 'translate-y-2');
            line2.classList.remove('opacity-0');
            line3.classList.remove('-rotate-45', '-translate-y-2');
        });
    });
}

// "Pro hosty" nav dropdown: close it when clicking anywhere outside (desktop
// hover-free click-to-open via native <details>/<summary> needs this for a
// dropdown feel — otherwise it stays open until the summary is clicked again).
document.querySelectorAll('details.nav-guests').forEach((details) => {
    document.addEventListener('click', (e) => {
        if (details.open && !details.contains(e.target)) {
            details.removeAttribute('open');
        }
    });
});

// Logo scroll to top (only meaningful when already on the home page)
const logo = document.getElementById('logo');
if (logo) {
    logo.addEventListener('click', (e) => {
        const onHomePage = window.location.pathname === logo.getAttribute('href') ||
            window.location.pathname.replace(/\/index\.html$/, '/') === logo.getAttribute('href');
        if (onHomePage) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// Scroll to top button
const scrollTopBtn = document.getElementById('scroll-top-btn');
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('opacity-100');
            scrollTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            scrollTopBtn.classList.remove('opacity-100');
            scrollTopBtn.classList.add('opacity-0', 'pointer-events-none');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Fade in on scroll
const observerOptions = { threshold: 0.15, rootMargin: '0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.opacity-fade').forEach(el => observer.observe(el));

// Image carousels (room/amenity photo groups). Each `[data-carousel]` container
// holds `.carousel-slide` images (only one shown at a time via the `.active`
// class) plus optional [data-carousel-prev] / [data-carousel-next] buttons.
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    if (slides.length <= 1) return;

    let current = slides.findIndex((s) => s.classList.contains('active'));
    if (current === -1) {
        current = 0;
        slides[0].classList.add('active');
    }

    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    const updateDots = () => {
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
    };

    // "3 / 18" position indicator (used by the reviews slider).
    const counter = carousel.querySelector('[data-carousel-counter]');
    const updateCounter = () => {
        if (counter) counter.textContent = (current + 1) + ' / ' + slides.length;
    };

    const show = (index) => {
        slides[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        updateDots();
        updateCounter();
    };

    // May be more than one prev/next (e.g. the reviews slider has side arrows on
    // desktop and a separate bottom set on mobile), so bind them all.
    carousel.querySelectorAll('[data-carousel-prev]').forEach((b) => b.addEventListener('click', () => show(current - 1)));
    carousel.querySelectorAll('[data-carousel-next]').forEach((b) => b.addEventListener('click', () => show(current + 1)));
    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));

    // Touch swipe (primary navigation on mobile, where the arrows are hidden).
    // Only a mostly-horizontal drag past the threshold counts, so vertical
    // page scrolling still works.
    let touchX = 0, touchY = 0;
    carousel.addEventListener('touchstart', (e) => {
        touchX = e.changedTouches[0].clientX;
        touchY = e.changedTouches[0].clientY;
    }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            show(dx < 0 ? current + 1 : current - 1);
        }
    }, { passive: true });

    updateDots();
    updateCounter();
});

// e-chalupy availability calendar: the iframe posts its content height on load and
// on resize, so we size the frame to fit — no inner scrollbar, works at any width.
window.addEventListener('message', (e) => {
    if (e.origin !== 'https://obsazenost.e-chalupy.cz') return;
    if (!e.data || e.data.msg !== 'echalupy-calendar-height') return;
    // On phones the frame is a fixed-height scroll box (see .echalupy-frame in
    // main.css); leave it be so the calendar scrolls internally instead of
    // stretching the page. On larger screens, fit the frame to its content.
    if (window.matchMedia('(max-width: 640px)').matches) return;
    const frame = document.getElementById('echalupy-kalendar');
    const height = parseInt(e.data.height, 10);
    if (frame && height > 0) frame.style.height = (height + 8) + 'px';
});
