/**
 * Protected profile page — Firestore user data + profile updates.
 */
(function initProfilePage() {
    const auth = AuthUtils.getAuth();

    const loadingEl = document.getElementById('profile-auth-loading');
    const loadingTextEl = loadingEl?.querySelector('p');
    const appEl = document.getElementById('profile-app');
    const cardEl = document.getElementById('profile-card');
    const cardBodyEl = document.getElementById('profile-card-body');
    const cardSkeletonEl = document.getElementById('profile-card-skeleton');
    const menuToggle = document.getElementById('profile-menu-toggle');
    const sidebarOverlay = document.getElementById('profile-sidebar-overlay');

    const logoutBtns = [
        document.getElementById('profile-logout'),
        document.getElementById('profile-logout-bottom'),
    ].filter(Boolean);

    const emailHeroEl = document.getElementById('profile-email');
    const emailDetailEl = document.getElementById('profile-email-detail');
    const uidEl = document.getElementById('profile-uid');
    const displayNameEl = document.getElementById('profile-display-name');
    const heroNameEl = document.getElementById('profile-hero-name');
    const rolePillEl = document.getElementById('profile-role');
    const roleDetailEl = document.getElementById('profile-role-detail');
    const createdAtEl = document.getElementById('profile-created-at');
    const topbarNameEl = document.getElementById('profile-topbar-name');
    const topbarEmailEl = document.getElementById('profile-topbar-email');
    const topbarInitialsEl = document.getElementById('profile-topbar-initials');
    const nameInput = document.getElementById('profile-name-input');
    const editForm = document.getElementById('profile-edit-form');
    const saveBtn = document.getElementById('profile-save-btn');
    const statusEl = document.getElementById('profile-status');
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarDefault = document.getElementById('profile-avatar-default');
    const avatarInitials = document.getElementById('profile-avatar-initials');
    const adminLinkEl = document.getElementById('profile-admin-link');

    let currentAuthUser = null;
    let currentProfile = null;

    const setLoadingMessage = (text) => {
        if (loadingTextEl) {
            loadingTextEl.textContent = text;
        }
    };

    const getInitials = (label) => {
        const name = (label || '?').trim();
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const setCardLoading = (loading) => {
        cardEl?.classList.toggle('is-loading', loading);
        cardEl?.setAttribute('aria-busy', loading ? 'true' : 'false');
        if (cardBodyEl) {
            cardBodyEl.hidden = loading;
        }
        if (cardSkeletonEl) {
            cardSkeletonEl.hidden = !loading;
        }
    };

    const setStatus = (message, type) => {
        if (!statusEl) {
            return;
        }
        if (!message) {
            statusEl.hidden = true;
            statusEl.textContent = '';
            statusEl.classList.remove('is-success', 'is-error');
            return;
        }
        statusEl.hidden = false;
        statusEl.textContent = message;
        statusEl.classList.remove('is-success', 'is-error');
        statusEl.classList.add(type === 'success' ? 'is-success' : 'is-error');
    };

    const formatDisplayName = (profile) => {
        const name = profile?.displayName?.trim();
        if (!name || name === UserService.DEFAULT_DISPLAY_NAME) {
            return 'Ism kiritilmagan';
        }
        return name;
    };

    const updateAvatar = (authUser, profile) => {
        const label = UserService.getDisplayLabel(profile, authUser);
        const photoURL = authUser.photoURL;

        if (photoURL && avatarImg) {
            avatarImg.src = photoURL;
            avatarImg.alt = label;
            avatarImg.hidden = false;
            if (avatarDefault) {
                avatarDefault.hidden = true;
            }
            return;
        }

        if (avatarImg) {
            avatarImg.hidden = true;
            avatarImg.removeAttribute('src');
        }
        if (avatarDefault) {
            avatarDefault.hidden = false;
        }
        if (avatarInitials) {
            avatarInitials.textContent = getInitials(label);
        }
    };

    const populateProfile = (authUser, profile) => {
        currentAuthUser = authUser;
        currentProfile = profile;

        const email = profile?.email || authUser.email || '—';
        const displayName = formatDisplayName(profile);
        const navLabel = UserService.getDisplayLabel(profile, authUser);
        const role = profile?.role || UserService.ROLE_USER;
        const isAdmin = UserService.isAdmin(profile);

        if (heroNameEl) {
            heroNameEl.textContent = navLabel;
        }
        if (emailHeroEl) {
            emailHeroEl.textContent = email;
        }
        if (emailDetailEl) {
            emailDetailEl.textContent = email;
        }
        if (uidEl) {
            uidEl.textContent = profile?.uid || authUser.uid || '—';
        }
        if (displayNameEl) {
            displayNameEl.textContent = displayName;
        }
        if (rolePillEl) {
            rolePillEl.textContent = role;
            rolePillEl.classList.toggle('is-admin', isAdmin);
        }
        if (roleDetailEl) {
            roleDetailEl.textContent = isAdmin ? 'Admin' : 'User';
        }
        if (createdAtEl) {
            createdAtEl.textContent = UserService.formatTimestamp(profile?.createdAt);
        }
        if (topbarNameEl) {
            topbarNameEl.textContent = navLabel;
        }
        if (topbarEmailEl) {
            topbarEmailEl.textContent = email;
        }
        if (topbarInitialsEl) {
            topbarInitialsEl.textContent = getInitials(navLabel);
        }
        if (nameInput) {
            const rawName = profile?.displayName?.trim();
            nameInput.value =
                rawName && rawName !== UserService.DEFAULT_DISPLAY_NAME ? rawName : '';
        }

        updateAvatar(authUser, profile);

        if (adminLinkEl) {
            adminLinkEl.hidden = !isAdmin;
        }
    };

    const revealProfile = (authUser, profile) => {
        setCardLoading(true);
        populateProfile(authUser, profile);
        setCardLoading(false);

        document.body.classList.add('profile-authenticated');

        if (loadingEl) {
            loadingEl.setAttribute('aria-busy', 'false');
        }
        if (appEl) {
            appEl.hidden = false;
        }
    };

    const closeSidebar = () => {
        document.body.classList.remove('dash-sidebar-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        if (sidebarOverlay) {
            sidebarOverlay.hidden = true;
        }
    };

    const openSidebar = () => {
        document.body.classList.add('dash-sidebar-open');
        menuToggle?.setAttribute('aria-expanded', 'true');
        if (sidebarOverlay) {
            sidebarOverlay.hidden = false;
        }
    };

    menuToggle?.addEventListener('click', () => {
        if (document.body.classList.contains('dash-sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay?.addEventListener('click', closeSidebar);

    const handleLogout = async (button) => {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Chiqilmoqda…';
        logoutBtns.forEach((btn) => {
            if (btn !== button) {
                btn.disabled = true;
            }
        });

        try {
            await AuthSession.signOut();
            AuthSession.goToLogin();
        } catch (error) {
            button.disabled = false;
            button.textContent = originalText;
            logoutBtns.forEach((btn) => {
                btn.disabled = false;
            });
            window.alert(AuthUtils.getErrorMessage(error));
        }
    };

    AuthSession.guardProtected(
        async (user, profile) => {
            setLoadingMessage('Ma’lumotlar yuklanmoqda…');
            revealProfile(user, profile);
        },
        {
            onError: async (error) => {
                if (AuthSession.isSecurityError(error)) {
                    await AuthSession.handleSecurityFailure(error);
                    return;
                }
                console.error('Profile error:', error);
                await AuthSession.handleSecurityFailure(error);
            },
        }
    );

    logoutBtns.forEach((btn) => {
        btn.addEventListener('click', () => handleLogout(btn));
    });

    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setStatus('');

            const user = auth.currentUser;
            if (!user) {
                AuthSession.goToLogin();
                return;
            }

            const displayName = nameInput?.value.trim() || '';

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saqlanmoqda…';
            }

            try {
                const profile = await UserService.updateDisplayName(user, displayName);
                populateProfile(auth.currentUser, profile);
                setStatus('Profil muvaffaqiyatli yangilandi.', 'success');
            } catch (error) {
                const message =
                    error?.code?.startsWith('auth/') || !error?.code
                        ? AuthUtils.getErrorMessage(error)
                        : UserService.getFirestoreErrorMessage(error);
                setStatus(message, 'error');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Saqlash';
                }
            }
        });
    }
})();
