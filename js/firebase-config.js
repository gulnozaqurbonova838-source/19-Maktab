/**
 * Firebase compat initialization (CDN scripts must load before this file).
 */
(function initFirebase() {
    const firebaseConfig = {
        apiKey: 'AIzaSyCZ0pr2I03Fm7TXbyR6hJV61Duhm6IsFYo',
        authDomain: 'maktab-e4030.firebaseapp.com',
        projectId: 'maktab-e4030',
        storageBucket: 'maktab-e4030.appspot.com',
        messagingSenderId: '440027961016',
        appId: '1:440027961016:web:0db0c0de11de487783064d',
        measurementId: 'G-X4FFP19XN7',
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    const db = firebase.firestore();

    window.firebaseAuth = auth;
    window.firebaseDb = db;
})();
