/**
 * Firestore user documents — collection: users / doc id: uid
 */
const UserService = {
    COLLECTION: 'users',
    DEFAULT_DISPLAY_NAME: 'New User',
    ROLE_USER: 'user',
    ROLE_ADMIN: 'admin',

    getDb() {
        return window.firebaseDb;
    },

    getUserRef(uid) {
        return this.getDb().collection(this.COLLECTION).doc(uid);
    },

    /**
     * Create user document on first login; return merged profile data.
     * @param {firebase.User} authUser
     * @returns {Promise<object>}
     */
    async ensureUserDocument(authUser) {
        if (!authUser?.uid) {
            throw new Error('Foydalanuvchi autentifikatsiyasi talab qilinadi.');
        }

        const ref = this.getUserRef(authUser.uid);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            const payload = {
                email: authUser.email || '',
                uid: authUser.uid,
                displayName: authUser.displayName?.trim() || this.DEFAULT_DISPLAY_NAME,
                role: this.ROLE_USER,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await ref.set(payload);
            const created = await ref.get();
            return this.normalizeDoc(created);
        }

        const existing = this.normalizeDoc(snapshot);

        if (authUser.email && existing.email !== authUser.email) {
            await ref.set({ email: authUser.email }, { merge: true });
            const updated = await ref.get();
            return this.normalizeDoc(updated);
        }

        return existing;
    },

    /**
     * @param {string} uid
     * @returns {Promise<object|null>}
     */
    async getUserDocument(uid) {
        if (!uid) {
            return null;
        }

        const snapshot = await this.getUserRef(uid).get();
        if (!snapshot.exists) {
            return null;
        }
        return this.normalizeDoc(snapshot);
    },

    /**
     * Fresh profile from Firestore (for security checks — never trust cache alone).
     * @param {string} uid
     * @returns {Promise<object|null>}
     */
    async requireUserDocument(uid) {
        const profile = await this.getUserDocument(uid);
        if (!profile) {
            const error = new Error('Foydalanuvchi profili topilmadi.');
            error.code = 'profile/not-found';
            throw error;
        }
        return profile;
    },

    /**
     * @param {firebase.User} authUser
     * @returns {Promise<object>}
     */
    async requireAdmin(authUser) {
        const profile = await this.requireUserDocument(authUser.uid);
        if (!this.isAdmin(profile)) {
            const error = new Error("Admin huquqi talab qilinadi.");
            error.code = 'permission-denied';
            throw error;
        }
        return profile;
    },

    /**
     * Update displayName in Firestore and Firebase Auth profile.
     * @param {firebase.User} authUser
     * @param {string} displayName
     * @returns {Promise<object>}
     */
    async updateDisplayName(authUser, displayName) {
        if (!authUser?.uid) {
            throw new Error('Foydalanuvchi autentifikatsiyasi talab qilinadi.');
        }

        const name = displayName.trim() || this.DEFAULT_DISPLAY_NAME;

        await this.getUserRef(authUser.uid).update({
            displayName: name,
            email: authUser.email || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        await authUser.updateProfile({ displayName: name });
        await authUser.reload();

        const profile = await this.getUserDocument(authUser.uid);
        return profile;
    },

    normalizeDoc(snapshot) {
        const data = snapshot.data() || {};
        return {
            id: snapshot.id,
            email: data.email || '',
            uid: data.uid || snapshot.id,
            displayName: data.displayName || this.DEFAULT_DISPLAY_NAME,
            role: data.role || this.ROLE_USER,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
        };
    },

    isAdmin(profile) {
        return profile?.role === this.ROLE_ADMIN;
    },

    /**
     * Prefer Firestore display name for UI; fall back to email.
     * @param {object|null} profile
     * @param {firebase.User|null} authUser
     * @returns {string}
     */
    getDisplayLabel(profile, authUser) {
        const name = profile?.displayName?.trim();
        if (name && name !== this.DEFAULT_DISPLAY_NAME) {
            return name;
        }
        const authName = authUser?.displayName?.trim();
        if (authName && authName !== this.DEFAULT_DISPLAY_NAME) {
            return authName;
        }
        return authUser?.email || 'Foydalanuvchi';
    },

    formatTimestamp(timestamp) {
        if (!timestamp) {
            return '—';
        }
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return '—';
        }
        return date.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },

    getFirestoreErrorMessage(error) {
        const code = error?.code || '';
        const messages = {
            'permission-denied': "Ruxsat yo'q. Bu amalni bajarish huquqingiz yo'q.",
            'not-found': "Foydalanuvchi ma'lumoti topilmadi.",
            'unavailable': 'Firestore vaqtincha mavjud emas. Qayta urinib ko‘ring.',
            'unauthenticated': 'Avval tizimga kiring.',
        };
        return messages[code] || error?.message || 'Ma’lumotlarni saqlashda xatolik yuz berdi.';
    },
};
