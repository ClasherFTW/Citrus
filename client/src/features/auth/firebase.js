import { getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCHChR54xUn9_fgdnPeJyC0cL-SZKvYtHI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "citrus-5589a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "citrus-5589a",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "citrus-5589a.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "493811785650",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:493811785650:web:f9196de40f6bdebe630eab",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-26VJ68B4LK",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export function subscribeToFirebaseIdTokenChanges(callback) {
  return onIdTokenChanged(auth, callback);
}

export function getCurrentFirebaseUser() {
  return auth.currentUser;
}

export function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export function signInWithEmailPassword({ email, password }) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function registerWithEmailPassword({ email, password }) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function updateFirebaseDisplayName(user, displayName) {
  if (!user || !displayName) {
    return Promise.resolve();
  }

  return updateProfile(user, { displayName });
}

export function signOutFirebase() {
  return signOut(auth);
}
