// Dark Mode Management
class DarkModeManager {
    constructor() {
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.themeToggle = document.querySelector('.theme-toggle');
        this.initDarkMode();
        this.setupThemeToggle();
    }

    initDarkMode() {
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark-mode');
            this.updateThemeIcon();
        }
        this.checkSystemPreference();
    }

    checkSystemPreference() {
        if (!localStorage.getItem('darkMode')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                this.toggleDarkMode();
            }
        }
    }

    setupThemeToggle() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        document.documentElement.classList.toggle('dark-mode');
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = this.isDarkMode ? '☀️' : '🌙';
            }
        }
    }
}

// Scroll reveal with staggered card animations
class ScrollAnimations {
    constructor() {
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.staggerStep = 70;
        this.maxStagger = 420;

        if (this.reducedMotion) {
            this.showAll();
            return;
        }

        this.prepareElements();
        this.initObserver();
        this.initNavScroll();
    }

    prepareElements() {
        const blockSelectors = [
            '.section-header',
            '.subsection-header',
            '.location-header',
            '.contact-info',
            '.contact-form',
            '.location-map',
            '.footer-grid',
        ];

        blockSelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                el.classList.add('reveal');
            });
        });

        const gridSelectors = [
            '.about-cards',
            '.team-cards',
            '.service-cards',
            '.testimonial-grid',
            '.news-grid',
            '.schedule-grid',
        ];

        gridSelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((grid) => {
                const items = grid.children;
                Array.from(items).forEach((item, index) => {
                    item.classList.add('reveal');
                    const delay = Math.min(index * this.staggerStep, this.maxStagger);
                    item.style.setProperty('--reveal-delay', String(delay));
                });
            });
        });
    }

    initObserver() {
        const revealElements = document.querySelectorAll('.reveal');

        if (!('IntersectionObserver' in window)) {
            revealElements.forEach((el) => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -6% 0px',
            }
        );

        revealElements.forEach((el) => observer.observe(el));
    }

    initNavScroll() {
        const nav = document.querySelector('.top-nav');
        if (!nav) {
            return;
        }

        let ticking = false;

        const updateNav = () => {
            nav.classList.toggle('is-scrolled', window.scrollY > 12);
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateNav);
                ticking = true;
            }
        };

        updateNav();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    showAll() {
        document.querySelectorAll('.reveal').forEach((el) => {
            el.classList.add('visible');
        });
    }
}

// Micro-interactions
class MicroInteractions {
    constructor() {
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.addButtonRipple();
        this.addSmoothScroll();
    }

    addButtonRipple() {
        if (this.reducedMotion) {
            return;
        }

        document.querySelectorAll('.btn, button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.classList.add('ripple-effect');
                button.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    addSmoothScroll() {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') {
                    return;
                }

                const target = document.querySelector(href);
                if (!target) {
                    return;
                }

                e.preventDefault();
                target.scrollIntoView({
                    behavior: prefersReduced ? 'auto' : 'smooth',
                    block: 'start',
                });
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dark Mode
    const darkModeManager = new DarkModeManager();

    // Initialize animations & micro-interactions
    new ScrollAnimations();
    new MicroInteractions();

    document.body.classList.add('loaded');

    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');
    const contactForm = document.querySelector('.contact-form');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') !== 'true';
            navToggle.setAttribute('aria-expanded', String(expanded));
            navLinks.classList.toggle('open');
        });
    }

    navItems.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href')?.replace('#', '');
            const targetSection = targetId ? document.getElementById(targetId) : null;

            if (targetSection) {
                event.preventDefault();
                targetSection.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    block: 'start',
                });
                window.history.pushState(null, '', `#${targetId}`);
            }

            navLinks?.classList.remove('open');
            navToggle?.setAttribute('aria-expanded', 'false');
        });
    });

    if (contactForm) {
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const formStatus = contactForm.querySelector('.form-status');
        const nameInput = contactForm.querySelector('#name');
        const emailInput = contactForm.querySelector('#email');
        const messageInput = contactForm.querySelector('#message');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const setFieldError = (input, errorId, message) => {
            const errorEl = contactForm.querySelector(`#${errorId}`);
            if (input) {
                input.classList.toggle('is-invalid', Boolean(message));
                input.setAttribute('aria-invalid', message ? 'true' : 'false');
            }
            if (errorEl) {
                errorEl.textContent = message;
            }
        };

        const clearFormErrors = () => {
            setFieldError(nameInput, 'name-error', '');
            setFieldError(emailInput, 'email-error', '');
            setFieldError(messageInput, 'message-error', '');
        };

        const showFormStatus = (message, type) => {
            if (!formStatus) {
                return;
            }
            formStatus.hidden = false;
            formStatus.textContent = message;
            formStatus.classList.remove('is-success', 'is-error');
            formStatus.classList.add(type === 'success' ? 'is-success' : 'is-error');
        };

        const hideFormStatus = () => {
            if (!formStatus) {
                return;
            }
            formStatus.hidden = true;
            formStatus.textContent = '';
            formStatus.classList.remove('is-success', 'is-error');
        };

        const validateContactForm = () => {
            clearFormErrors();
            hideFormStatus();

            const name = nameInput?.value.trim() ?? '';
            const email = emailInput?.value.trim() ?? '';
            const message = messageInput?.value.trim() ?? '';
            let isValid = true;

            if (!name) {
                setFieldError(nameInput, 'name-error', "Ism maydoni to'ldirilishi shart.");
                isValid = false;
            } else if (name.length < 2) {
                setFieldError(nameInput, 'name-error', 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak.');
                isValid = false;
            }

            if (!email) {
                setFieldError(emailInput, 'email-error', "Email maydoni to'ldirilishi shart.");
                isValid = false;
            } else if (!emailPattern.test(email)) {
                setFieldError(emailInput, 'email-error', "Iltimos, to'g'ri email manzilini kiriting.");
                isValid = false;
            }

            if (!message) {
                setFieldError(messageInput, 'message-error', "Xabar maydoni to'ldirilishi shart.");
                isValid = false;
            } else if (message.length < 10) {
                setFieldError(messageInput, 'message-error', 'Xabar kamida 10 ta belgidan iborat bo‘lishi kerak.');
                isValid = false;
            }

            return isValid;
        };

        [nameInput, emailInput, messageInput].forEach((input) => {
            input?.addEventListener('input', () => {
                const errorId = `${input.id}-error`;
                if (contactForm.querySelector(`#${errorId}`)?.textContent) {
                    validateContactForm();
                }
            });
        });

        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!validateContactForm()) {
                showFormStatus("Iltimos, formadagi xatolarni tuzating.", 'error');
                return;
            }

            const name = nameInput?.value.trim() ?? '';

            if (submitButton) {
                submitButton.disabled = true;
            }

            showFormStatus(
                `Rahmat, ${name}! Xabaringiz qabul qilindi. Tez orada siz bilan bog‘lanamiz.`,
                'success'
            );
            contactForm.reset();
            clearFormErrors();

            if (submitButton) {
                submitButton.disabled = false;
            }
        });
    }

    const sections = document.querySelectorAll('section[id]');
    const offset = 100;

    const setActiveLink = () => {
        const scrollPosition = window.pageYOffset;

        sections.forEach((section) => {
            const sectionTop = section.offsetTop - offset;
            const sectionHeight = section.offsetHeight;
            const id = section.getAttribute('id');

            if (id && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navItems.forEach((link) => {
                    const isActive = link.getAttribute('href') === `#${id}`;
                    link.classList.toggle('active', isActive);
                    link.toggleAttribute('aria-current', isActive);
                });
            }
        });
    };

    let scrollTicking = false;

    const onScroll = () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                setActiveLink();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    setActiveLink();
});
