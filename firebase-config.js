
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA3B-1lZD0S-HqEG1aZWCwTqO4VsEe7HVk",
    authDomain: "eventease1-cdee9.firebaseapp.com",
    projectId: "eventease1-cdee9",
    storageBucket: "eventease1-cdee9.firebasestorage.app",
    messagingSenderId: "258133477980",
    appId: "1:258133477980:web:4209bd5b3edf7712793499"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const authReady = signInAnonymously(auth);

export { db, authReady };
