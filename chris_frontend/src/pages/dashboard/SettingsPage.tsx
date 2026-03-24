import { useNavigate } from "react-router-dom";
import { GlassCard } from "../../components/ui/GlassCard";
import { useAuth } from "../../contexts/AuthContext";
import { useToasts } from "../../contexts/ToastContext";

/**
 * PUBLIC_INTERFACE
 */
export function SettingsPage() {
  /** Settings and account controls. */
  const { configured, user, signOut } = useAuth();
  const { pushToast } = useToasts();
  const nav = useNavigate();

  const onSignOut = async () => {
    try {
      await signOut();
      pushToast({ variant: "success", title: "Signed out" });
      nav("/login");
    } catch (e) {
      pushToast({
        variant: "error",
        title: "Sign out failed",
        message: e instanceof Error ? e.message : "Unknown error"
      });
    }
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <GlassCard title="Account" subtitle="Authentication & session info">
        {!configured ? (
          <div className="callout info">
            Supabase not configured. This environment is running in <b>demo mode</b>.
          </div>
        ) : (
          <>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="h3">Signed in</div>
                <div className="muted">{user?.email || "Unknown user"}</div>
              </div>
              <button className="btn ghost" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          </>
        )}
      </GlassCard>

      <GlassCard title="About" subtitle="CHRIS frontend">
        <div className="muted">
          This dashboard integrates with the FastAPI backend endpoints:
          <ul style={{ marginTop: 8 }}>
            <li>
              <code>/model/info</code>
            </li>
            <li>
              <code>/predict/flood_risk</code>
            </li>
          </ul>
        </div>
      </GlassCard>
    </div>
  );
}
