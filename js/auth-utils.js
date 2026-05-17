/**
 * Shared Firebase Auth helpers.
 */
const AuthUtils = {
    getAuth() {
        return window.firebaseAuth;
    },

    waitForAuthReady() {
        return new Promise((resolve) => {
            const auth = this.getAuth();
            if (!auth) {
                resolve(null);
                return;
            }
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    },

    getErrorMessage(error) {
        const code = error?.code || '';
        const messages = {
            'auth/invalid-email': "Email manzili noto'g'ri.",
            'auth/user-disabled': 'Bu hisob bloklangan.',
            'auth/user-not-found': "Foydalanuvchi topilmadi yoki parol noto'g'ri.",
            'auth/wrong-password': "Foydalanuvchi topilmadi yoki parol noto'g'ri.",
            'auth/invalid-credential': "Email yoki parol noto'g'ri.",
            'auth/too-many-requests': "Juda ko'p urinish. Biroz kutib qayta urinib ko'ring.",
            'auth/network-request-failed': 'Internet aloqasini tekshiring.',
            'auth/email-already-in-use': 'Bu email allaqachon ro‘yxatdan o‘tgan.',
            'auth/weak-password': 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.',
            'auth/operation-not-allowed': "Email/parol orqali kirish Firebase'da yoqilmagan.",
            'auth/missing-password': 'Parolni kiriting.',
        };
        return messages[code] || error?.message || 'Xatolik yuz berdi. Qayta urinib ko‘ring.';
    },

    isAuthError(error) {
        return Boolean(error?.code?.startsWith('auth/'));
    },
};
