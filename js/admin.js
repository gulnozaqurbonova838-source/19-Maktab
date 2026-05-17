/**
 * Admin panel — role=admin only, real-time Firestore users.
 */
(function initAdminPanel() {
    const loadingEl = document.getElementById('admin-auth-loading');
    const loadingTextEl = loadingEl?.querySelector('p');
    const appEl = document.getElementById('admin-app');
    const toastEl = document.getElementById('admin-toast');
    const logoutBtn = document.getElementById('admin-logout');
    const menuToggle = document.getElementById('admin-menu-toggle');
    const sidebarOverlay = document.getElementById('admin-sidebar-overlay');
    const topbarNameEl = document.getElementById('admin-topbar-name');
    const topbarEmailEl = document.getElementById('admin-topbar-email');
    const topbarInitialsEl = document.getElementById('admin-topbar-initials');
    const usersTbody = document.getElementById('admin-users-tbody');
    const usersCountEl = document.getElementById('admin-users-count');
    const statTotal = document.getElementById('admin-stat-total');
    const statAdmins = document.getElementById('admin-stat-admins');
    const statUsers = document.getElementById('admin-stat-users');

    const navLinks = document.querySelectorAll('[data-admin-view]');
    const panels = document.querySelectorAll('.admin-panel');
    const gotoButtons = document.querySelectorAll('[data-admin-goto]');

    let currentAuthUser = null;
    let usersCache = [];
    let unsubscribeUsers = null;
    let statsLoaded = false;

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

    const showToast = (message, type) => {
        if (!toastEl) {
            return;
        }
        if (!message) {
            toastEl.hidden = true;
            toastEl.textContent = '';
            toastEl.classList.remove('is-success', 'is-error');
            return;
        }
        toastEl.hidden = false;
        toastEl.textContent = message;
        toastEl.classList.remove('is-success', 'is-error');
        toastEl.classList.add(type === 'success' ? 'is-success' : 'is-error');
        window.setTimeout(() => showToast('', ''), 4000);
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

    const switchView = (viewId) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('data-admin-view') === viewId;
            link.classList.toggle('is-active', isActive);
        });

        panels.forEach((panel) => {
            const isActive = panel.getAttribute('data-panel') === viewId;
            panel.classList.toggle('is-active', isActive);
            panel.hidden = !isActive;
        });

        closeSidebar();
    };

    const escapeHtml = (value) => {
        const div = document.createElement('div');
        div.textContent = value ?? '';
        return div.innerHTML;
    };

    const setStatValue = (el, value) => {
        if (!el) {
            return;
        }
        el.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = String(value);
        el.appendChild(span);
    };

    const setStatsLoading = (loading) => {
        [statTotal, statAdmins, statUsers].forEach((el) => {
            if (!el) {
                return;
            }
            if (loading) {
                el.innerHTML = '<span class="dash-stat-skeleton" aria-hidden="true"></span>';
            }
        });
    };

    const updateStats = (users) => {
        const total = users.length;
        const admins = users.filter((u) => u.role === UserService.ROLE_ADMIN).length;
        const regular = total - admins;

        setStatValue(statTotal, total);
        setStatValue(statAdmins, admins);
        setStatValue(statUsers, regular);
        statsLoaded = true;
    };

    const formatDisplayName = (user) => {
        const name = user.displayName?.trim();
        if (!name || name === UserService.DEFAULT_DISPLAY_NAME) {
            return '—';
        }
        return name;
    };

    const renderUsersTable = (users) => {
        if (!usersTbody) {
            return;
        }

        usersCache = users;
        updateStats(users);

        if (usersCountEl) {
            usersCountEl.textContent = `${users.length} ta foydalanuvchi`;
        }

        if (!users.length) {
            usersTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="admin-empty">Hozircha foydalanuvchilar yo‘q.</td>
                </tr>
            `;
            return;
        }

        usersTbody.innerHTML = users
            .map((user) => {
                const isSelf = user.uid === currentAuthUser?.uid;
                const roleClass =
                    user.role === UserService.ROLE_ADMIN
                        ? 'admin-role-badge--admin'
                        : 'admin-role-badge--user';
                const displayName = escapeHtml(formatDisplayName(user));
                const isAdmin = user.role === UserService.ROLE_ADMIN;
                const nextRole = isAdmin ? UserService.ROLE_USER : UserService.ROLE_ADMIN;
                const roleBtnLabel = isAdmin ? 'Make user' : 'Make admin';
                const roleBtnClass = isAdmin ? 'admin-btn--role is-admin-toggle' : 'admin-btn--role';

                return `
                    <tr data-uid="${escapeHtml(user.uid)}">
                        <td class="name-cell">${displayName}</td>
                        <td>${escapeHtml(user.email || '—')}</td>
                        <td class="uid-cell admin-col-uid" title="${escapeHtml(user.uid)}">${escapeHtml(user.uid)}</td>
                        <td>
                            <span class="admin-role-badge ${roleClass}">${escapeHtml(user.role)}</span>
                        </td>
                        <td class="date-cell">${escapeHtml(UserService.formatTimestamp(user.createdAt))}</td>
                        <td class="actions-cell">
                            <div class="admin-actions">
                                <button type="button" class="admin-btn ${roleBtnClass}" data-action="role" data-uid="${escapeHtml(user.uid)}" data-role="${escapeHtml(nextRole)}" ${isSelf ? 'disabled title="O‘z rolingizni shu yerda o‘zgartirmang"' : ''}>
                                    ${roleBtnLabel}
                                </button>
                                <button type="button" class="admin-btn admin-btn--danger" data-action="delete" data-uid="${escapeHtml(user.uid)}" ${isSelf ? 'disabled' : ''}>
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join('');
    };

    const setTableLoading = () => {
        if (!usersTbody) {
            return;
        }
        if (usersCountEl) {
            usersCountEl.textContent = 'Yuklanmoqda…';
        }
        usersTbody.innerHTML = `
            <tr class="admin-loading-row">
                <td colspan="6">
                    <span class="admin-table-loading">
                        <span class="dashboard-spinner" aria-hidden="true"></span>
                        Yuklanmoqda…
                    </span>
                </td>
            </tr>
        `;
    };

    const handleUsersUpdate = (users) => {
        renderUsersTable(users);
    };

    const handleUsersError = (error) => {
        console.error('Users subscription error:', error);
        if (usersTbody) {
            usersTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="admin-empty">${escapeHtml(UserService.getFirestoreErrorMessage(error))}</td>
                </tr>
            `;
        }
        showToast(UserService.getFirestoreErrorMessage(error), 'error');
    };

    const startUsersSubscription = async () => {
        if (unsubscribeUsers) {
            unsubscribeUsers();
            unsubscribeUsers = null;
        }

        if (!statsLoaded) {
            setStatsLoading(true);
        }
        setTableLoading();

        try {
            unsubscribeUsers = await AdminService.subscribeAllUsers(
                currentAuthUser,
                handleUsersUpdate,
                handleUsersError
            );
        } catch (error) {
            handleUsersError(error);
        }
    };

    const revealAdmin = async (authUser, profile) => {
        currentAuthUser = authUser;

        const label = UserService.getDisplayLabel(profile, authUser);
        const email = authUser.email || '—';

        if (topbarNameEl) {
            topbarNameEl.textContent = label;
        }
        if (topbarEmailEl) {
            topbarEmailEl.textContent = email;
        }
        if (topbarInitialsEl) {
            topbarInitialsEl.textContent = getInitials(label);
        }

        document.body.classList.add('admin-authenticated');

        if (loadingEl) {
            loadingEl.setAttribute('aria-busy', 'false');
        }
        if (appEl) {
            appEl.hidden = false;
        }

        await startUsersSubscription();
    };

    AuthSession.guardAdmin(async (user, profile) => {
        setLoadingMessage('Rol tekshirilmoqda…');
        await revealAdmin(user, profile);
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const view = link.getAttribute('data-admin-view');
            if (view) {
                switchView(view);
            }
        });
    });

    gotoButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-admin-goto');
            if (view) {
                switchView(view);
            }
        });
    });

    if (usersTbody) {
        usersTbody.addEventListener('click', async (event) => {
            const roleBtn = event.target.closest('[data-action="role"]');
            const deleteBtn = event.target.closest('[data-action="delete"]');

            if (roleBtn && currentAuthUser) {
                const uid = roleBtn.getAttribute('data-uid');
                const newRole = roleBtn.getAttribute('data-role');
                const user = usersCache.find((u) => u.uid === uid);
                const label = user?.email || uid;

                if (
                    !window.confirm(
                        `"${label}" foydalanuvchisining rolini "${newRole}" qilasizmi?`
                    )
                ) {
                    return;
                }

                roleBtn.disabled = true;

                try {
                    await AdminService.updateUserRole(currentAuthUser, uid, newRole);
                    showToast('Rol muvaffaqiyatli yangilandi.', 'success');
                } catch (error) {
                    showToast(
                        error?.message?.includes('O‘z')
                            ? error.message
                            : UserService.getFirestoreErrorMessage(error),
                        'error'
                    );
                    roleBtn.disabled = false;
                }
                return;
            }

            if (deleteBtn && currentAuthUser) {
                const uid = deleteBtn.getAttribute('data-uid');
                const user = usersCache.find((u) => u.uid === uid);
                const label = user?.email || uid;

                if (!window.confirm(`"${label}" foydalanuvchisini Firestore’dan o‘chirasizmi?`)) {
                    return;
                }

                deleteBtn.disabled = true;

                try {
                    await AdminService.deleteUser(currentAuthUser, uid);
                    showToast('Foydalanuvchi o‘chirildi.', 'success');
                } catch (error) {
                    showToast(
                        error?.message?.includes('O‘z')
                            ? error.message
                            : UserService.getFirestoreErrorMessage(error),
                        'error'
                    );
                    deleteBtn.disabled = false;
                }
            }
        });
    }

    logoutBtn?.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        try {
            if (unsubscribeUsers) {
                unsubscribeUsers();
            }
            await AuthSession.signOut();
            AuthSession.goToLogin();
        } catch (error) {
            logoutBtn.disabled = false;
            window.alert(AuthUtils.getErrorMessage(error));
        }
    });

    menuToggle?.addEventListener('click', () => {
        if (document.body.classList.contains('dash-sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay?.addEventListener('click', closeSidebar);

    window.addEventListener('beforeunload', () => {
        if (unsubscribeUsers) {
            unsubscribeUsers();
        }
    });
})();
