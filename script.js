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
            '.gallery-grid',
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

// Gallery lightbox
class GalleryLightbox {
    constructor() {
        this.lightbox = document.getElementById('gallery-lightbox');
        this.triggers = document.querySelectorAll('.gallery-trigger');
        if (!this.lightbox || !this.triggers.length) {
            return;
        }

        this.imageEl = this.lightbox.querySelector('.gallery-lightbox__image');
        this.captionEl = this.lightbox.querySelector('.gallery-lightbox__caption');
        this.closeButtons = this.lightbox.querySelectorAll('[data-gallery-close]');
        this.prevButton = this.lightbox.querySelector('[data-gallery-prev]');
        this.nextButton = this.lightbox.querySelector('[data-gallery-next]');
        this.currentIndex = 0;
        this.lastFocused = null;

        this.slides = Array.from(this.triggers).map((trigger) => {
            const img = trigger.querySelector('img');
            const caption = trigger.querySelector('.gallery-caption');
            return {
                src: img?.dataset.fullSrc || img?.src || '',
                alt: img?.alt || '',
                caption: caption?.textContent?.trim() || img?.alt || '',
            };
        });

        this.triggers.forEach((trigger, index) => {
            trigger.addEventListener('click', () => this.open(index));
        });

        this.closeButtons.forEach((btn) => {
            btn.addEventListener('click', () => this.close());
        });

        this.prevButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.show(this.currentIndex - 1);
        });

        this.nextButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.show(this.currentIndex + 1);
        });

        this.lightbox.addEventListener('keydown', (e) => this.onKeydown(e));
    }

    open(index) {
        this.lastFocused = document.activeElement;
        this.show(index);
        this.lightbox.classList.add('is-open');
        this.lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('gallery-lightbox-open');
        this.closeButtons[0]?.focus();
    }

    close() {
        this.lightbox.classList.remove('is-open');
        this.lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('gallery-lightbox-open');
        this.lastFocused?.focus();
    }

    show(index) {
        const total = this.slides.length;
        if (!total) {
            return;
        }
        this.currentIndex = ((index % total) + total) % total;
        const slide = this.slides[this.currentIndex];
        if (this.imageEl) {
            this.imageEl.src = slide.src;
            this.imageEl.alt = slide.alt;
        }
        if (this.captionEl) {
            this.captionEl.textContent = slide.caption;
        }
        if (this.prevButton) {
            this.prevButton.hidden = total <= 1;
        }
        if (this.nextButton) {
            this.nextButton.hidden = total <= 1;
        }
    }

    onKeydown(event) {
        if (this.lightbox.getAttribute('aria-hidden') === 'true') {
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.show(this.currentIndex - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.show(this.currentIndex + 1);
        }
    }
}

// AI chat assistant (frontend-only, predefined responses)
class AIChatAssistant {
    constructor() {
        this.root = document.getElementById('ai-chat');
        if (!this.root) {
            return;
        }

        this.panel = document.getElementById('ai-chat-panel');
        this.toggle = document.getElementById('ai-chat-toggle');
        this.closeBtn = this.root.querySelector('[data-chat-close]');
        this.messagesEl = document.getElementById('ai-chat-messages');
        this.form = document.getElementById('ai-chat-form');
        this.input = document.getElementById('ai-chat-input');
        this.chips = this.root.querySelectorAll('[data-chat-suggest]');
        this.isOpen = false;
        this.isBusy = false;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.typingMs = this.reducedMotion ? 500 : 1200;
        this.replyMs = this.reducedMotion ? 300 : 500;

        this.responses = {
            schedule: [
                'Haftalik dars jadvali (namuna):',
                '',
                'Dushanba — 08:30 Matematika (5-A), 09:20 Ona tili (5-A)',
                'Seshanba — 08:30 Biologiya (6-B), 09:20 Adabiyot (8-V)',
                'Chorshanba — 08:30 Matematika (7-A), 09:20 Informatika (6-B)',
                'Payshanba — 08:30 Fizika (7-A), 09:20 Ingliz tili (5-A)',
                'Juma — 08:30 Kimyo (8-V), 09:20 Biologiya (5-A)',
                'Shanba — 08:30 Qo‘shimcha matematika (7-A), 09:20 Sport mashg‘ulotlari',
                '',
                'To‘liq jadval uchun saytdagi «JADVAL» bo‘limiga o‘ting.',
            ].join('\n'),
            news: [
                'So‘nggi yangiliklar va e’lonlar:',
                '',
                '• 1 sentyabr 2026 — Yangi o‘quv yili tantanali ochilish marosimi bilan boshlanadi.',
                '• 20 aprel 2026 — Fan olimpiadasi: maktab o‘quvchilari viloyat bosqichida yuqori natija ko‘rsatdi.',
                '• 10 may 2026 — III chorak yakuni bo‘yicha ota-onalar yig‘ilishi, soat 15:00.',
                '• 5–7 mart 2026 — Maktablararo bahor sport musobaqasi sport maydonchasida.',
                '',
                'Batafsil ma’lumot uchun «YANGILIKLAR» bo‘limini ko‘ring.',
            ].join('\n'),
            contact: [
                'Biz bilan bog‘lanish:',
                '',
                'Manzil: Chirchiq shahri, Yangi O‘zbekiston massivi',
                'Telefon: +998 71 123 45 67',
                'Email: info@19maktab.uz',
                '',
                'Savol yoki taklif uchun saytdagi «ALOQA» bo‘limidagi forma orqali xabar yuborishingiz mumkin.',
            ].join('\n'),
            greeting: 'Assalomu alaykum! Men 19-Maktab AI yordamchisiman. Dars jadvali, yangiliklar yoki aloqa haqida yozing — yordam beraman.',
            default: [
                'Kechirasiz, bu savolga aniq javobim yo‘q. Quyidagilardan birini so‘rashingiz mumkin:',
                '',
                '• Dars jadvali (masalan: «Dushanba darslari»)',
                '• Yangiliklar va e’lonlar',
                '• Aloqa: telefon, email, manzil',
                '',
                'Yoki pastdagi tezkor tugmalardan foydalaning.',
            ].join('\n'),
        };

        this.matchRules = [
            {
                test: (t) => /salom|assalom|hello|hi|rahmat|yordamchi/.test(t),
                key: 'greeting',
            },
            {
                test: (t) =>
                    /jadval|dars|schedule|dushanba|seshanba|chorshanba|payshanba|juma|shanba|soat|matematika|fizika|kimyo|biologiya|informatika|sport/.test(
                        t
                    ),
                key: 'schedule',
            },
            {
                test: (t) =>
                    /yangilik|e'lon|e’lon|e`lon|news|olimpiada|yig'ilish|yig‘ilishi|sport musobaqa|sentabr|mart|aprel|may|chorak|o'quv yili|o‘quv yili/.test(
                        t
                    ),
                key: 'news',
            },
            {
                test: (t) =>
                    /aloqa|bog'lan|bog‘lan|contact|telefon|email|manzil|forma|xabar|fikr|joylashuv|qayerda|manzil/.test(
                        t
                    ),
                key: 'contact',
            },
        ];

        this.bindEvents();
    }

    bindEvents() {
        this.toggle?.addEventListener('click', () => this.togglePanel());
        this.closeBtn?.addEventListener('click', () => this.close());
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserMessage(this.input?.value ?? '');
        });
        this.chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                const text = chip.getAttribute('data-chat-suggest') ?? chip.textContent ?? '';
                this.handleUserMessage(text);
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    togglePanel() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.root.classList.add('is-open');
        this.panel?.setAttribute('aria-hidden', 'false');
        this.toggle?.setAttribute('aria-expanded', 'true');
        this.input?.focus();
    }

    close() {
        this.isOpen = false;
        this.root.classList.remove('is-open');
        this.panel?.setAttribute('aria-hidden', 'true');
        this.toggle?.setAttribute('aria-expanded', 'false');
        this.toggle?.focus();
    }

    getReply(text) {
        const normalized = text
            .toLowerCase()
            .normalize('NFKC')
            .replace(/[''`]/g, "'");

        for (const rule of this.matchRules) {
            if (rule.test(normalized)) {
                return this.responses[rule.key];
            }
        }
        return this.responses.default;
    }

    appendMessage(role, text) {
        if (!this.messagesEl) {
            return;
        }

        const row = document.createElement('div');
        row.className = `ai-chat-message ai-chat-message--${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'ai-chat-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = role === 'user' ? 'Siz' : 'AI';

        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        bubble.appendChild(paragraph);

        row.appendChild(avatar);
        row.appendChild(bubble);
        this.messagesEl.appendChild(row);
        this.scrollToBottom();
    }

    showTyping() {
        if (!this.messagesEl) {
            return null;
        }

        const row = document.createElement('div');
        row.className = 'ai-chat-message ai-chat-message--assistant ai-chat-message--typing';
        row.setAttribute('data-typing', 'true');

        const avatar = document.createElement('div');
        avatar.className = 'ai-chat-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = 'AI';

        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        bubble.innerHTML = `
            <span class="ai-chat-typing" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="ai-chat-typing-label">AI yozmoqda...</span>
        `;

        row.appendChild(avatar);
        row.appendChild(bubble);
        this.messagesEl.appendChild(row);
        this.scrollToBottom();
        return row;
    }

    hideTyping(node) {
        node?.remove();
    }

    scrollToBottom() {
        if (this.messagesEl) {
            this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        }
    }

    setBusy(busy) {
        this.isBusy = busy;
        if (this.input) {
            this.input.disabled = busy;
        }
        const sendBtn = this.form?.querySelector('.ai-chat-send');
        if (sendBtn) {
            sendBtn.disabled = busy;
        }
        this.chips.forEach((chip) => {
            chip.disabled = busy;
        });
    }

    async handleUserMessage(rawText) {
        const text = rawText.trim();
        if (!text || this.isBusy) {
            return;
        }

        if (!this.isOpen) {
            this.open();
        }

        this.appendMessage('user', text);
        if (this.input) {
            this.input.value = '';
        }

        this.setBusy(true);
        const typingNode = this.showTyping();

        await new Promise((resolve) => {
            window.setTimeout(resolve, this.typingMs);
        });

        this.hideTyping(typingNode);

        await new Promise((resolve) => {
            window.setTimeout(resolve, this.replyMs);
        });

        this.appendMessage('assistant', this.getReply(text));
        this.setBusy(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dark Mode
    const darkModeManager = new DarkModeManager();

    // Initialize animations & micro-interactions
    new ScrollAnimations();
    new MicroInteractions();
    new GalleryLightbox();
    new AIChatAssistant();

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
