import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ModelProvider } from "./contexts/ModelContext";
import { ChatbotOverlay } from "./components/ChatbotOverlay";

/**
 * PUBLIC_INTERFACE
 */
export function App() {
  /** Main application shell and providers. */
  const location = useLocation();

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ModelProvider>
            <AnimatePresence mode="wait" initial={false}>
              {/* Key by pathname so route transitions animate cleanly */}
              <AppRouter key={location.pathname} />
            </AnimatePresence>

            <ChatbotOverlay />
          </ModelProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
