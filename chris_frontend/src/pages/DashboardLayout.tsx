import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { ToastStack } from "../components/ToastStack";

/**
 * PUBLIC_INTERFACE
 */
export function DashboardLayout() {
  /** Main dashboard shell. */
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashMain">
        <TopBar />
        <div className="dashContent">
          <Outlet />
        </div>
      </div>

      <ToastStack />
    </div>
  );
}
