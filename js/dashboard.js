/**
 * SaaS dashboard — protected, Firestore-backed stats.
 */
(function initDashboard() {
    const logoutBtn = document.getElementById('auth-logout');
    const loadingEl = document.getElementById('dashboard-auth-loading');
    const loadingTextEl = loadingEl?.querySelector('p');
    const appEl = document.getElementById('dashboard-app');
    const contentEl = document.getElementById('dash-content');
    const menuToggle = document.getElementById('dash-menu-toggle');
    const sidebarOverlay = document.getElementById('dash-sidebar-overlay');

    const welcomeEl = document.getElementById('dashboard-welcome');
    const userEmailEl = document.getElementById('dashboard-user-email');
    const rolePillEl = document.getElementById('dashboard-user-role');
    const topbarNameEl = document.getElementById('dash-topbar-name');
    const topbarEmailEl = document.getElementById('dash-topbar-email');
    const avatarInitialsEl = document.getElementById('dash-avatar-initials');
    const adminNavLink = document.getElementById('dash-admin-link');
    const adminActionLink = document.getElementById('dash-action-admin');

    const statTotalUsers = document.getElementById('stat-total-users');
    const statTotalHint = document.getElementById('stat-total-hint');
    const statActiveSession = document.getElementById('stat-active-session');
    const statProfileCompletion = document.getElementById('stat-profile-completion');
    const statProfileBar = document.getElementById('stat-profile-bar');

    const metaUid = document.getElementById('dash-meta-uid');
    const metaRole = document.getElementById('dash-meta-role');
    const metaCreated = document.getElementById('dash-meta-created');

    const setLoadingMessage = (text) => {
        if (loadingTextEl) {
            loadingTextEl.textContent = text;
        }
    };

    const setContentLoading = (loading) => {
        contentEl?.classList.toggle('is-loading', loading);
        contentEl?.setAttribute('aria-busy', loading ? 'true' : 'false');
    };

    const getInitials = (label) => {
        const name = (label || '?').trim();
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const getProfileCompletion = (profile) => {
        let score = 0;
        if (profile?.email) {
            score += 34;
        }
        if (profile?.uid) {
            score += 33;
        }
        const name = profile?.displayName?.trim();
        if (name && name !== UserService.DEFAULT_DISPLAY_NAME) {
            score += 33;
        }
        return Math.min(100, score);
    };

    const setStatText = (el, text, extraClass) => {
        if (!el) {
            return;
        }
        el.innerHTML = '';
        const span = document.createElement('span');
        if (extraClass) {
            span.className = extraClass;
        }
        span.textContent = text;
        el.appendChild(span);
    };

    const setStatSkeleton = (el) => {
        if (!el) {
            return;
        }
        el.innerHTML = '<span class="dash-stat-skeleton" aria-hidden="true"></span>';
    };

    const loadStats = async (authUser, profile) => {
        setStatSkeleton(statTotalUsers);
        setStatSkeleton(statActiveSession);
        setStatSkeleton(statProfileCompletion);

        const completion = getProfileCompletion(profile);
        setStatText(statActiveSession, 'Faol', 'dash-stat-value--success');
        setStatText(statProfileCompletion, `${completion}%`);
        if (statProfileBar) {
            statProfileBar.style.width = `${completion}%`;
        }

        if (UserService.isAdmin(profile)) {
            try {
                const users = await AdminService.getAllUsers(authUser);
                setStatText(statTotalUsers, String(users.length));
                if (statTotalHint) {
                    statTotalHint.textContent = 'Barcha foydalanuvchilar';
                }
            } catch (error) {
                console.error('Stats load error:', error);
                setStatText(statTotalUsers, '—');
                if (statTotalHint) {
                    statTotalHint.textContent = 'Ruxsat yo‘q';
                }
            }
        } else {
            setStatText(statTotalUsers, '1');
            if (statTotalHint) {
                statTotalHint.textContent = 'Faqat sizning hisobingiz';
            }
        }
    };

    const revealDashboard = async (authUser, profile) => {
        const displayLabel = UserService.getDisplayLabel(profile, authUser);
        const email = authUser.email || '—';
        const role = profile?.role || UserService.ROLE_USER;
        const isAdmin = UserService.isAdmin(profile);

        if (welcomeEl) {
            welcomeEl.textContent = `Xush kelibsiz, ${displayLabel}`;
        }
        if (userEmailEl) {
            userEmailEl.textContent = email;
        }
        if (rolePillEl) {
            rolePillEl.textContent = role;
        }
        if (topbarNameEl) {
            topbarNameEl.textContent = displayLabel;
        }
        if (topbarEmailEl) {
            topbarEmailEl.textContent = email;
        }
        if (avatarInitialsEl) {
            avatarInitialsEl.textContent = getInitials(displayLabel);
        }
        if (metaUid) {
            metaUid.textContent = profile?.uid || authUser.uid || '—';
        }
        if (metaRole) {
            metaRole.textContent = role;
        }
        if (metaCreated) {
            metaCreated.textContent = UserService.formatTimestamp(profile?.createdAt);
        }

        if (adminNavLink) {
            adminNavLink.hidden = !isAdmin;
        }
        if (adminActionLink) {
            adminActionLink.hidden = !isAdmin;
        }

        document.body.classList.add('dash-authenticated');

        if (loadingEl) {
            loadingEl.setAttribute('aria-busy', 'false');
        }
        if (appEl) {
            appEl.hidden = false;
        }

        setContentLoading(true);
        await loadStats(authUser, profile);
        setContentLoading(false);
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

    AuthSession.guardProtected(
        async (user, profile) => {
            setLoadingMessage('Ma’lumotlar yuklanmoqda…');
            await revealDashboard(user, profile);
        },
        {
            onError: async (error) => {
                if (AuthSession.isSecurityError(error)) {
                    await AuthSession.handleSecurityFailure(error);
                    return;
                }
                console.error('Dashboard error:', error);
                await AuthSession.handleSecurityFailure(error);
            },
        }
    );

    logoutBtn?.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        const label = logoutBtn.textContent;
        logoutBtn.textContent = 'Chiqilmoqda…';

        try {
            await AuthSession.signOut();
            AuthSession.goToLogin();
        } catch (error) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = label;
            window.alert(AuthUtils.getErrorMessage(error));
        }
    });
})();
