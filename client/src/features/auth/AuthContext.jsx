import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getCurrentUser, logoutUser, syncFirebaseProfile } from "./authApi";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  persistSession,
} from "../../lib/session";
import { closeSocket } from "../chat/socketClient";
import {
  getCurrentFirebaseUser,
  registerWithEmailPassword,
  signInWithEmailPassword,
  signInWithGooglePopup,
  signOutFirebase,
  subscribeToFirebaseIdTokenChanges,
  updateFirebaseDisplayName,
} from "./firebase";

const AuthContext = createContext(null);

const sanitizeUsername = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

const resolvePreferredUsername = (firebaseUser, fallbackUsername) => {
  const preferredFromPayload = sanitizeUsername(fallbackUsername);
  if (preferredFromPayload) return preferredFromPayload;

  const fromDisplayName = sanitizeUsername(firebaseUser?.displayName || "");
  if (fromDisplayName) return fromDisplayName;

  const fromEmail = sanitizeUsername(
    String(firebaseUser?.email || "")
      .split("@")[0]
      .trim()
  );
  if (fromEmail) return fromEmail;

  return "";
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const pendingUsernameRef = useRef("");

  const establishBackendSession = useCallback(async (firebaseUser, fallbackUsername = "") => {
    const idToken = await firebaseUser.getIdToken(true);
    const preferredUsername = resolvePreferredUsername(
      firebaseUser,
      fallbackUsername || pendingUsernameRef.current
    );

    persistSession({ token: idToken });
    setToken(idToken);

    await syncFirebaseProfile(
      {
        username: preferredUsername || undefined,
        avatarUrl: firebaseUser.photoURL || undefined,
      },
      idToken
    );

    const profile = await getCurrentUser(idToken);
    persistSession({ token: idToken, user: profile });
    setUser(profile);
    setToken(idToken);
    pendingUsernameRef.current = "";

    return profile;
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToFirebaseIdTokenChanges(async (firebaseUser) => {
      if (!mounted) return;

      setIsBootstrapping(true);

      if (!firebaseUser) {
        closeSocket();
        clearSession();
        setUser(null);
        setToken(null);
        setIsBootstrapping(false);
        return;
      }

      try {
        await establishBackendSession(firebaseUser);
      } catch (_error) {
        closeSocket();
        clearSession();
        setUser(null);
        setToken(null);
        pendingUsernameRef.current = "";
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [establishBackendSession]);

  const login = useCallback(
    async ({ email, password }) => {
      await signInWithEmailPassword({ email, password });
      return null;
    },
    []
  );

  const register = useCallback(
    async ({ username, email, password }) => {
      pendingUsernameRef.current = username || "";
      const credential = await registerWithEmailPassword({ email, password });
      if (username) {
        await updateFirebaseDisplayName(credential.user, username);
      }

      return null;
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    await signInWithGooglePopup();
    return null;
  }, []);

  const logout = useCallback(async () => {
    const current = getCurrentFirebaseUser();
    try {
      if (current) {
        const idToken = await current.getIdToken();
        await logoutUser(idToken);
      }
    } catch (_error) {
      // Ignore network/logout endpoint errors.
    } finally {
      await signOutFirebase();
      closeSocket();
      clearSession();
      setUser(null);
      setToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isBootstrapping,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, token, isBootstrapping, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return ctx;
}
