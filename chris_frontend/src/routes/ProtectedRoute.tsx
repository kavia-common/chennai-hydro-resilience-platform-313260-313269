import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  /** Redirects to /login if user is not authenticated (Supabase). */
  const { loading, configured, session } = useAuth();
  const location = useLocation();

  // If Supabase isn't configured, we still allow access (demo mode).
  if (!configured) return <>{children}</>;

  if (loading) {
    return (
      <div className="pageCenter">
        <div className="glassCard" style={{ maxWidth: 520 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="h3">Loading session…</div>
              <div className="muted">Checking authentication.</div>
            </div>
            <div className="spinner" aria-label="Loading" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
