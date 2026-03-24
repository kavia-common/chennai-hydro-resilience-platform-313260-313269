import { motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";

import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { DashboardLayout } from "../pages/DashboardLayout";
import { OverviewPage } from "../pages/dashboard/OverviewPage";
import { ModelAPage } from "../pages/dashboard/ModelAPage";
import { SettingsPage } from "../pages/dashboard/SettingsPage";
import { ProtectedRoute } from "./ProtectedRoute";

const pageVariants = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(6px)" }
};

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * PUBLIC_INTERFACE
 */
export function AppRouter() {
  /** Application routes with motion transitions. */
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route
        path="/"
        element={
          <Page>
            <LandingPage />
          </Page>
        }
      />
      <Route
        path="/login"
        element={
          <Page>
            <LoginPage />
          </Page>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="model-a" element={<ModelAPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="*"
        element={
          <Page>
            <div className="pageCenter">
              <div className="glassCard" style={{ maxWidth: 560 }}>
                <h1 className="h2">Page not found</h1>
                <p className="muted">
                  The page you’re looking for doesn’t exist. Use the navigation to continue.
                </p>
                <a className="btn primary" href="/">
                  Go to Landing
                </a>
              </div>
            </div>
          </Page>
        }
      />
    </Routes>
  );
}
