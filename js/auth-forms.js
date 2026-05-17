/**
 * Login & register forms on index.html#login
 */
(function initAuthForms() {
    const loginForm = document.getElementById('auth-login-form');
    const registerForm = document.getElementById('auth-register-form');

    if (!loginForm && !registerForm) {
        return;
    }

    const errorEl = document.getElementById('auth-error');
    const successEl = document.getElementById('auth-success');
    const tabButtons = document.querySelectorAll('[data-auth-tab]');
    const panels = document.querySelectorAll('[data-auth-panel]');

    AuthSession.guardGuest();

    const setError = (message) => {
        if (!errorEl) {
            return;
        }
        if (message) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        } else {
            errorEl.textContent = '';
            errorEl.hidden = true;
        }
    };

    const setSuccess = (message) => {
        if (!successEl) {
            return;
        }
        if (message) {
            successEl.textContent = message;
            successEl.hidden = false;
        } else {
            successEl.textContent = '';
            successEl.hidden = true;
        }
    };

    const setFormLoading = (form, loading) => {
        const submit = form?.querySelector('button[type="submit"]');
        if (submit) {
            submit.disabled = loading;
            submit.setAttribute('aria-busy', loading ? 'true' : 'false');
        }
        form?.querySelectorAll('input').forEach((input) => {
            input.disabled = loading;
        });
    };

    const switchTab = (tabId) => {
        tabButtons.forEach((btn) => {
            const isActive = btn.getAttribute('data-auth-tab') === tabId;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        panels.forEach((panel) => {
            const isActive = panel.getAttribute('data-auth-panel') === tabId;
            panel.hidden = !isActive;
            panel.classList.toggle('is-active', isActive);
        });
        setError('');
        setSuccess('');
    };

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-auth-tab'));
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setError('');
            setSuccess('');

            const email = loginForm.email.value.trim();
            const password = loginForm.password.value;

            if (!email || !password) {
                setError("Email va parolni kiriting.");
                return;
            }

            setFormLoading(loginForm, true);

            try {
                await AuthSession.signIn(email, password);
                AuthSession.goToDashboard();
            } catch (error) {
                const message = error?.code?.startsWith('firestore/')
                    ? UserService.getFirestoreErrorMessage(error)
                    : AuthUtils.getErrorMessage(error);
                setError(message);
            } finally {
                setFormLoading(loginForm, false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setError('');
            setSuccess('');

            const email = registerForm.email.value.trim();
            const password = registerForm.password.value;
            const confirm = registerForm.confirmPassword.value;
            const displayName = registerForm.displayName?.value?.trim() || '';

            if (!email || !password || !confirm) {
                setError("Barcha majburiy maydonlarni to'ldiring.");
                return;
            }

            if (password.length < 6) {
                setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
                return;
            }

            if (password !== confirm) {
                setError('Parollar mos kelmaydi.');
                return;
            }

            setFormLoading(registerForm, true);

            try {
                await AuthSession.register(email, password, displayName);
                AuthSession.goToDashboard();
            } catch (error) {
                const message = error?.code?.startsWith('firestore/')
                    ? UserService.getFirestoreErrorMessage(error)
                    : AuthUtils.getErrorMessage(error);
                setError(message);
            } finally {
                setFormLoading(registerForm, false);
            }
        });
    }
})();
