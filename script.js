document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');
    const contactForm = document.querySelector('.contact-form');

    window.requestAnimationFrame(() => {
        document.body.classList.add('animated');
    });

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    navItems.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href')?.replace('#', '');
            const targetSection = targetId ? document.getElementById(targetId) : null;

            if (targetSection) {
                event.preventDefault();
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.pushState(null, '', `#${targetId}`);
            }

            navLinks?.classList.remove('open');
        });
    });

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = contactForm.querySelector('#name')?.value.trim();
            const email = contactForm.querySelector('#email')?.value.trim();
            const message = contactForm.querySelector('#message')?.value.trim();

            if (!name || !email || !message) {
                alert("Iltimos, barcha maydonlarni to'ldiring.");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert("Iltimos, to'g'ri email manzilini kiriting.");
                return;
            }

            alert(`Rahmat, ${name}! Xabaringiz muvaffaqiyatli yuborildi.`);
            contactForm.reset();
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
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    };

    window.addEventListener('scroll', setActiveLink);
    setActiveLink();
});
