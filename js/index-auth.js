/**
 * Show login screen on index.html when hash is #login (dashboard redirect target).
 */
(function initIndexAuth() {
    const loginSection = document.getElementById('login');
    const backLink = document.getElementById('auth-back-home');

    if (!loginSection) {
        return;
    }

    const showLogin = () => {
        loginSection.hidden = false;
        document.body.classList.add('auth-login-active');
        document.title = 'Kirish — 19-Maktab';
    };

    const hideLogin = () => {
        loginSection.hidden = true;
        document.body.classList.remove('auth-login-active');
        document.title = '19-Maktab';
    };

    const syncFromHash = () => {
        const hash = window.location.hash;
        if (hash === '#login' || hash === '#register') {
            showLogin();
            if (hash === '#register') {
                const registerTab = document.querySelector('[data-auth-tab="register"]');
                registerTab?.click();
            }
        } else {
            hideLogin();
        }
    };

    if (backLink) {
        backLink.addEventListener('click', () => {
            window.location.hash = 'home';
        });
    }

    window.addEventListener('hashchange', syncFromHash);
    syncFromHash();
})();
