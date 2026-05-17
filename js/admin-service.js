/**
 * Admin-only Firestore operations — caller must pass admin verification first.
 */
const AdminService = {
    sortUsers(users) {
        return [...users].sort((a, b) => (a.email || '').localeCompare(b.email || '', 'uz'));
    },

    mapSnapshot(snapshot) {
        return this.sortUsers(
            snapshot.docs.map((doc) => UserService.normalizeDoc(doc))
        );
    },

    async getAllUsers(authUser) {
        await AuthSession.assertAdminAction(authUser);

        const snapshot = await UserService.getDb().collection(UserService.COLLECTION).get();

        return this.mapSnapshot(snapshot);
    },

    /**
     * Real-time users collection listener (admin only).
     * @returns {Promise<function>} unsubscribe
     */
    async subscribeAllUsers(authUser, onUpdate, onError) {
        await AuthSession.assertAdminAction(authUser);

        return UserService.getDb()
            .collection(UserService.COLLECTION)
            .onSnapshot(
                (snapshot) => {
                    onUpdate(this.mapSnapshot(snapshot));
                },
                (error) => {
                    if (onError) {
                        onError(error);
                    }
                }
            );
    },

    async updateUserRole(authUser, uid, role) {
        await AuthSession.assertAdminAction(authUser);

        if (!uid) {
            throw new Error('Foydalanuvchi UID talab qilinadi.');
        }

        const validRoles = [UserService.ROLE_USER, UserService.ROLE_ADMIN];
        if (!validRoles.includes(role)) {
            throw new Error('Noto‘g‘ri rol.');
        }

        if (uid === authUser.uid && role !== UserService.ROLE_ADMIN) {
            throw new Error('O‘z admin rolingizni pasaytira olmaysiz.');
        }

        await UserService.getUserRef(uid).update({
            role,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        return UserService.getUserDocument(uid);
    },

    async deleteUser(authUser, uid) {
        await AuthSession.assertAdminAction(authUser);

        if (!uid) {
            throw new Error('Foydalanuvchi UID talab qilinadi.');
        }

        if (uid === authUser.uid) {
            throw new Error('O‘z hisobingizni o‘chira olmaysiz.');
        }

        await UserService.getUserRef(uid).delete();
    },
};
