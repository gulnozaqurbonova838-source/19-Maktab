/**
 * Central Firebase Auth session — persistence, guards, post-login bootstrap.
 */
const AuthSession = {
    LOGIN_URL: 'index.html#login',
    DASHBOARD_URL: 'dashboard.html',
    ADMIN_URL: 'admin.html',
    PROFILE_URL: 'profile.html',

    getAuth() {
        return AuthUtils.getAuth();
    },

    waitForUser() {
        return AuthUtils.waitForAuthReady();
    },

    async bootstrapUser(authUser) {
        return UserService.ensureUserDocument(authUser);
    },

    isSecurityError(error) {
        const code = error?.code || '';
        return (
            code === 'permission-denied' ||
            code === 'unauthenticated' ||
            code === 'profile/not-found'
        );
    },

    async handleSecurityFailure(error) {
        console.error('Security failure:', error);
        try {
            await this.signOut();
        } catch (signOutError) {
            console.error('Sign out error:', signOutError);
        }
        this.goToLogin();
    },

    async signIn(email, password) {
        const credential = await this.getAuth().signInWithEmailAndPassword(email, password);
        await this.bootstrapUser(credential.user);
        return credential.user;
    },

    async register(email, password, displayName) {
        const credential = await this.getAuth().createUserWithEmailAndPassword(email, password);
        const user = credential.user;

        const name = displayName?.trim();
        if (name) {
            await user.updateProfile({ displayName: name });
        }

        await this.bootstrapUser(user);
        return user;
    },

    async signOut() {
        await this.getAuth().signOut();
    },

    goToLogin() {
        window.location.replace(this.LOGIN_URL);
    },

    goToDashboard() {
        window.location.replace(this.DASHBOARD_URL);
    },

    goToAdmin() {
        window.location.replace(this.ADMIN_URL);
    },

    /**
     * Any authenticated user with a valid Firestore profile.
     */
    guardProtected(onAuthenticated, options = {}) {
        const auth = this.getAuth();
        let resolved = false;

        auth.onAuthStateChanged(async (user) => {
            if (resolved) {
                return;
            }

            if (!user) {
                resolved = true;
                this.goToLogin();
                return;
            }

            resolved = true;

            try {
                const profile = await UserService.requireUserDocument(user.uid);
                await onAuthenticated(user, profile);
            } catch (error) {
                if (this.isSecurityError(error)) {
                    await this.handleSecurityFailure(error);
                    return;
                }
                console.error('AuthSession bootstrap error:', error);
                if (options.onError) {
                    await options.onError(error, user);
                } else {
                    await this.handleSecurityFailure(error);
                }
            }
        });
    },

    /**
     * Admin-only pages — role verified from Firestore (not URL/cache alone).
     */
    guardAdmin(onAuthenticated, options = {}) {
        this.guardProtected(async (user) => {
            try {
                const freshProfile = await UserService.requireAdmin(user);
                await onAuthenticated(user, freshProfile);
            } catch (error) {
                if (this.isSecurityError(error) || error?.code === 'permission-denied') {
                    this.goToDashboard();
                    return;
                }
                if (options.onError) {
                    await options.onError(error, user);
                } else {
                    this.goToDashboard();
                }
            }
        }, options);
    },

    /**
     * Re-verify admin role before destructive admin actions.
     */
    async assertAdminAction(authUser) {
        return UserService.requireAdmin(authUser);
    },

    guardGuest() {
        const auth = this.getAuth();
        let resolved = false;

        auth.onAuthStateChanged(async (user) => {
            if (resolved) {
                return;
            }
            resolved = true;

            if (!user) {
                return;
            }

            try {
                await this.bootstrapUser(user);
                this.goToDashboard();
            } catch (error) {
                console.error('AuthSession guest redirect error:', error);
            }
        });
    },
};
