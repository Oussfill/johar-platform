import { supabase } from "../supabase";
﻿import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  AccessScope,
  JoharMe,
  clearAuth,
  fetchMe,
  getStoredMe,
  getToken,
  googleSignIn,
  inferScope,
  login, signUp as register,
  setStoredMe,
} from "../auth";

export interface AuthState {
  token: string | null;
  me: JoharMe | null;
  scope: AccessScope;
  loading: boolean;
  authed: boolean;
  /** Ø§Ø³ØªØ¯Ø¹Ø§Ø¡ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø«Ù… Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø¯ÙˆØ± Ù…Ù† /auth/me */
  signIn: (email: string, password: string) => Promise<JoharMe>;
  signUp: (email: string, password: string) => Promise<JoharMe | void>;
  /** Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø­Ø³Ø§Ø¨ Google Ù…Ø¨Ø§Ø´Ø±Ø© (Ø¨Ø¯ÙˆÙ† backend) */
  signInWithGoogle: () => Promise<JoharMe>;
  signOut: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [me, setMe] = useState<JoharMe | null>(() => getStoredMe());
  const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()));

  // Ø¹Ù†Ø¯ ÙˆØ¬ÙˆØ¯ Ø±Ù…Ø²ØŒ ÙŠÙØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¬Ù„Ø³Ø© ÙˆÙŠÙÙ‚Ø±Ø£ Ø§Ù„Ø¯ÙˆØ±. Ø¬Ù„Ø³Ø§Øª Google (GIS) ØªÙØ®Ø²ÙÙ‘Ù† (me)
  // Ù…Ø­Ù„ÙŠÙ‹Ø§ØŒ ÙÙ„Ø§ Ù†Ø­ØªØ§Ø¬ Ø§Ø³ØªØ¯Ø¹Ø§Ø¡ /auth/me Ø§Ù„Ø°ÙŠ Ù„Ø§ ÙˆØ¬ÙˆØ¯ Ù„Ù‡ Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø´Ø± Ø§Ù„Ø³Ø§ÙƒÙ† Ø­Ø§Ù„ÙŠÙ‹Ø§.

  useEffect(() => {
    let alive = true;

    const initSupabaseAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setToken(session.access_token);
        localStorage.setItem("sb-token", session.access_token);
        try {
          const m = await fetchMe();
          if (alive) {
            setStoredMe(m);
            setMe(m);
          }
        } catch (err) {
          if (alive) {
            clearAuth();
            setToken(null);
            setMe(null);
          }
        }
      } else if (token && !me) {
        // Fallback for email login if session wasn't picked up natively
        try {
          const m = await fetchMe();
          if (alive) {
            setStoredMe(m);
            setMe(m);
          }
        } catch (err) {
          if (alive) {
            clearAuth();
            setToken(null);
            setMe(null);
          }
        }
      }
      if (alive) setLoading(false);
    };

    initSupabaseAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setToken(session.access_token);
        localStorage.setItem("sb-token", session.access_token);
        try {
          const m = await fetchMe();
          setStoredMe(m);
          setMe(m);
        } catch (err) {
          // ignore
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
        setToken(null);
        setMe(null);
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);


  const signUp = useCallback(async (email: string, password: string) => {
    const { accessToken } = await register(email, password);
    if (accessToken) {
      localStorage.setItem("sb-token", accessToken);
      const m = await fetchMe();
      setStoredMe(m);
      setToken(accessToken);
      setMe(m);
      return m;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { accessToken } = await login(email, password);
    localStorage.setItem("sb-token", accessToken);
    const m = await fetchMe();
      setStoredMe(m);
      setToken(accessToken);
      setMe(m);
    return m;
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    setToken(null);
    setMe(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const m = await googleSignIn();
    setToken(getToken());
    setMe(m);
    return m;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      me,
      scope: inferScope(me?.roles ?? []),
      loading,
      authed: Boolean(token && me),
      signIn, signUp,
      signInWithGoogle,
      signOut,
      logout: signOut,
    }),
    [token, me, loading, signIn, signUp, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}



