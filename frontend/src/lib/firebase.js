import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBIME-DucrGA-m5_8qlHuHtYjlOaMzzPdI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ruchistore-36d2d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ruchistore-36d2d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ruchistore-36d2d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "95962476290",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:95962476290:web:48eaecf5648462795f9c1b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-G23R9P7ZVL",
};

let app = null;
let auth = null;
let googleProvider = null;

if (typeof window !== "undefined") {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (error) {
    console.warn("Firebase initialization warning:", error);
  }
}

export { app, auth, googleProvider };
