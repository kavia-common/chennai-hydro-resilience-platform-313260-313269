import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseClient } from "../lib/supabase";
import { getFrontendUrl } from "../lib/env";

type AuthState = {
  loading: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * PUBLIC_INTERFACE
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  /** Provides Supabase auth session state and methods. */
  const supabase = getSupabaseClient();
  const configured = Boolean(supabase);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        if (!supabase) {
          if (mounted) setLoading(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(data.session ?? null);
        setLoading(false);

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
        });

        return () => sub.subscription.unsubscribe();
      } catch {
        if (mounted) setLoading(false);
      }
    }

    const cleanupPromise = bootstrap();
    return () => {
      mounted = false;
      void cleanupPromise;
    };
  }, [supabase]);

  const value = useMemo<AuthState>(() => {
    return {
      loading,
      configured,
      session,
      user: session?.user ?? null,
      signInWithPassword: async (email, password) => {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUpWithPassword: async (email, password) => {
        if (!supabase) throw new Error("Supabase is not configured.");
        const emailRedirectTo = getFrontendUrl();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo }
        });
        if (error) throw error;
      },
      signOut: async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    };
  }, [configured, loading, session, supabase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 */
export function useAuth(): AuthState {
  /** Hook to access auth state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
