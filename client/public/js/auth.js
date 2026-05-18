import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const tokenKey = "cylink_token";
const messageEl = document.querySelector("#authMessage");
const form = document.querySelector("#emailAuthForm");
const googleButton = document.querySelector("#googleLoginBtn");
const firebaseConfig = window.__CYLINK_FIREBASE_CONFIG__ || {};
const nextPath = window.__CYLINK_NEXT_PATH__ || "/app";

const missingConfig = ["apiKey", "authDomain", "projectId", "appId"].filter(
  (key) => !firebaseConfig[key]
);

if (missingConfig.length) {
  messageEl.textContent = `Firebase web config missing: ${missingConfig.join(", ")}`;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const setMessage = (text) => {
  if (messageEl) {
    messageEl.textContent = text;
  }
};

const createServerSession = async (idToken, username = "", avatarUrl = "") => {
  const response = await fetch("/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken, username, avatarUrl }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Unable to establish server session.");
  }

  localStorage.setItem(tokenKey, idToken);
};

const completeSignIn = async (user, username = "") => {
  const idToken = await user.getIdToken();
  await createServerSession(idToken, username, user.photoURL || "");
  window.location.href = nextPath;
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitter = event.submitter;
  const mode = submitter?.dataset?.mode || "login";
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const username = String(formData.get("username") || "").trim();

  try {
    setMessage(mode === "signup" ? "Creating account..." : "Signing in...");

    let credential;
    if (mode === "signup") {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } else {
      credential = await signInWithEmailAndPassword(auth, email, password);
    }

    await completeSignIn(credential.user, username);
  } catch (error) {
    setMessage(error.message || "Authentication failed.");
  }
});

googleButton?.addEventListener("click", async () => {
  try {
    setMessage("Signing in with Google...");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(auth, provider);
    await completeSignIn(credential.user);
  } catch (error) {
    setMessage(error.message || "Google sign-in failed.");
  }
});
