import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useToasts } from "../contexts/ToastContext";

type Mode = "signin" | "signup";

function getFromPath(state: unknown): string | null {
  if (!state || typeof state !== "object") return null;
  const maybe = (state as { from?: unknown }).from;
  return typeof maybe === "string" ? maybe : null;
}

/**
 * PUBLIC_INTERFACE
 */
export function LoginPage() {
  /** Login/signup page backed by Supabase auth. */
  const { configured, signInWithPassword, signUpWithPassword } = useAuth();
  const { pushToast, toasts, dismissToast } = useToasts();

  const nav = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTo = useMemo(() => getFromPath(location.state) ?? "/dashboard", [location.state]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      nav("/dashboard");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithPassword(email.trim(), password);
        pushToast({ variant: "success", title: "Signed in", message: "Welcome back." });
        nav(redirectTo);
      } else {
        await signUpWithPassword(email.trim(), password);
        pushToast({
          variant: "success",
          title: "Account created",
          message: "Check your email to confirm (if confirmations are enabled)."
        });
        nav("/dashboard");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      pushToast({ variant: "error", title: "Auth error", message: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authBg" aria-hidden="true" />

      <motion.div
        className="authCard glassCard"
        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="brand compact">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <div className="brandName">CHRIS</div>
            <div className="brandTag">Secure access to the dashboard</div>
          </div>
        </div>

        {!configured && (
          <div className="callout info">
            Supabase is not configured in this environment. You can continue in <b>demo mode</b>.
          </div>
        )}

        <div className="segmented">
          <button
            className={mode === "signin" ? "segBtn active" : "segBtn"}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === "signup" ? "segBtn active" : "segBtn"}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              type="email"
              required
              autoComplete="email"
            />
          </label>

          <label className="label">
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
            />
          </label>

          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button className="btn ghost" type="button" onClick={() => nav("/dashboard")}>
            Continue to dashboard
          </button>

          <div className="muted" style={{ fontSize: 13 }}>
            Tip: After signing in, open <b>Model A</b> and run a prediction to populate the map + charts.
          </div>
        </form>
      </motion.div>

      {/* Toasts */}
      <div className="toastStack" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant || "info"}`}>
            <div className="toastTitle">{t.title}</div>
            {t.message && <div className="toastMsg">{t.message}</div>}
            <button className="toastClose" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
