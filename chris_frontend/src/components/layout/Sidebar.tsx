import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "sideLink active" : "sideLink";

/**
 * PUBLIC_INTERFACE
 */
export function Sidebar() {
  /** Left navigation bar for dashboard. */
  return (
    <aside className="sidebar glassPanel">
      <div className="sideHeader">
        <div className="brand compact">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <div className="brandName">CHRIS</div>
            <div className="brandTag">Dashboard</div>
          </div>
        </div>
      </div>

      <nav className="sideNav" aria-label="Dashboard navigation">
        <NavLink to="/dashboard" end className={linkClass}>
          <span className="sideDot" aria-hidden="true" />
          Overview
        </NavLink>
        <NavLink to="/dashboard/model-a" className={linkClass}>
          <span className="sideDot" aria-hidden="true" />
          Model A • Flood Risk
        </NavLink>
        <NavLink to="/dashboard/settings" className={linkClass}>
          <span className="sideDot" aria-hidden="true" />
          Settings
        </NavLink>
      </nav>

      <div className="sideFooter">
        <div className="muted" style={{ fontSize: 12 }}>
          Blue/white theme • Framer Motion • Map + Charts
        </div>
      </div>
    </aside>
  );
}
