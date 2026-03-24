import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

/**
 * PUBLIC_INTERFACE
 */
export function LandingPage() {
  /** Public marketing/landing page for CHRIS. */
  const { configured } = useAuth();

  return (
    <div className="landing">
      <div className="landingBg" aria-hidden="true" />

      <header className="landingHeader">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <div className="brandName">CHRIS</div>
            <div className="brandTag">Chennai Hydro‑Resilience Intelligence System</div>
          </div>
        </div>

        <nav className="landingNav">
          <a className="navLink" href="#features">
            Features
          </a>
          <a className="navLink" href="#workflow">
            Workflow
          </a>
          <Link className="btn primary" to="/login">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="landingMain">
        <motion.section
          className="hero"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.h1 className="heroTitle" variants={fadeUp}>
            Flood intelligence.
            <span className="heroAccent"> Actionable resilience.</span>
          </motion.h1>

          <motion.p className="heroSubtitle" variants={fadeUp}>
            A professional decision dashboard for Chennai: forecast risk (Model A), visualize context on a live map,
            and communicate results with clear charts and explanations.
          </motion.p>

          <motion.div className="heroActions" variants={fadeUp}>
            <Link className="btn primary" to="/login">
              Get Started
            </Link>
            <Link className="btn ghost" to="/dashboard">
              Explore Dashboard
            </Link>
            {!configured && (
              <span className="pill info">Demo mode: Supabase not configured</span>
            )}
          </motion.div>

          <motion.div className="heroCards" variants={fadeUp}>
            <div className="glassCard">
              <div className="cardTitle">Model A • Flood Risk</div>
              <div className="muted">
                Submit climate indices over a sequence window and get next-month rainfall + flood probability.
              </div>
            </div>
            <div className="glassCard">
              <div className="cardTitle">Map + Charts</div>
              <div className="muted">
                View predicted risk on an interactive map and interpret outcomes via clean visuals.
              </div>
            </div>
            <div className="glassCard">
              <div className="cardTitle">Professional UX</div>
              <div className="muted">
                Glassmorphism layout, smooth transitions, and a floating assistant for quick explanations.
              </div>
            </div>
          </motion.div>
        </motion.section>

        <section id="features" className="landingSection">
          <h2 className="h2">What you get</h2>
          <div className="grid3">
            <div className="feature">
              <div className="featureIcon" aria-hidden="true" />
              <div className="featureTitle">End‑to‑end prediction flow</div>
              <div className="muted">
                Dashboard integrates directly with the FastAPI backend: <code>/model/info</code> +{" "}
                <code>/predict/flood_risk</code>.
              </div>
            </div>
            <div className="feature">
              <div className="featureIcon" aria-hidden="true" />
              <div className="featureTitle">Chennai‑focused map</div>
              <div className="muted">
                A central map panel with risk visualization and smooth UI performance.
              </div>
            </div>
            <div className="feature">
              <div className="featureIcon" aria-hidden="true" />
              <div className="featureTitle">Charts that explain</div>
              <div className="muted">
                Clean charts to communicate rainfall magnitude and flood probability at a glance.
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="landingSection">
          <h2 className="h2">Workflow</h2>
          <div className="glassCard">
            <ol className="steps">
              <li>
                <b>Sign in</b> to access the dashboard.
              </li>
              <li>
                <b>Open Model A</b> and fill the sequence window (or use sample data).
              </li>
              <li>
                <b>Predict</b> to fetch rainfall + flood probability from the backend.
              </li>
              <li>
                <b>Interpret</b> using map + charts and the assistant overlay.
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="landingFooter">
        <div className="muted">
          © {new Date().getFullYear()} CHRIS • Built for hydro‑resilience decision support
        </div>
      </footer>
    </div>
  );
}
