import "./App.css";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import i18n from "./i18n";

import HomePage from "./pages/HomePage.jsx";
import FaqPage from "./pages/FaqPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import MediaMonitoringPage from "./pages/MediaMonitoringPage.jsx";
import ProfilesPage from "./pages/ProfilesPage.jsx";
import SocialListeningPage from "./pages/SocialListeningPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import Login from "./pages/Login.jsx";
import RequestAccessPage from "./pages/RequestAccessPage.jsx";
import SetPasswordPage from "./pages/SetPasswordPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TeamPage from "./pages/TeamPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import PostsPage from "./pages/PostsPage.jsx";
import SentimentPage from "./pages/SentimentPage.jsx";
import AlertsPage from "./pages/AlertsPage.jsx";
import TopicsPage from "./pages/TopicsPage.jsx";
import SurveysPage from "./pages/SurveysPage.jsx";
import EngagementPage from "./pages/EngagementPage";
import PublicSurveyPage from "./pages/PublicSurveyPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import AppNavbar from "./components/AppNavbar.jsx";
import InsightsPage from "./pages/InsightsPage";
import FeedbackPage from "./pages/FeedbackPage";
import GantraLogo from "./components/GantraLogo.jsx";
import ChatWidget from "./components/ChatWidget";
import { useTranslation } from "react-i18next";
import { useLanguage } from "./contexts/LanguageContext";
import { useTheme } from "./contexts/ThemeContext";

/* ================= PUBLIC LAYOUT ================= */
function PublicLayout({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      color: "var(--text)",
    }}>
      <Header />
      <main style={{ flex: 1, paddingTop: "60px" }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

/* ================= APP LAYOUT ================= */
function AppLayout({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      color: "var(--text)",
    }}>
      <AppNavbar />
      {children}
      <ChatWidget />
    </div>
  );
}

/* ================= APP ================= */
function App() {
  const location = useLocation();

  useEffect(() => {
    i18n.changeLanguage(i18n.language);
  }, [location.pathname]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      color: "var(--text)",
    }}>
      <Routes>
        {/* Public marketing pages */}
        <Route path="/"                          element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/resources/faq"             element={<PublicLayout><FaqPage /></PublicLayout>} />
        <Route path="/contact-us"                element={<PublicLayout><ContactPage /></PublicLayout>} />
        <Route path="/products/media-monitoring" element={<PublicLayout><MediaMonitoringPage /></PublicLayout>} />
        <Route path="/products/profiles"         element={<PublicLayout><ProfilesPage /></PublicLayout>} />
        <Route path="/products/social-listening" element={<PublicLayout><SocialListeningPage /></PublicLayout>} />

        {/* Auth pages — no header/footer */}
        <Route path="/login"          element={<Login />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
        <Route path="/set-password"   element={<SetPasswordPage />} />
        <Route path="/s/:token"       element={<PublicSurveyPage />} />

        {/* Internal app pages */}
        <Route path="/dashboard" element={
          <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute adminOnly><AppLayout><TeamPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute adminOnly><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/posts" element={
          <ProtectedRoute><AppLayout><PostsPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute><AppLayout><AlertsPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/sentiment" element={
          <ProtectedRoute><AppLayout><SentimentPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/topics" element={
          <ProtectedRoute><AppLayout><TopicsPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/surveys" element={
          <ProtectedRoute adminOnly><AppLayout><SurveysPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/engagement" element={
          <ProtectedRoute><AppLayout><EngagementPage /></AppLayout></ProtectedRoute>
        } />
        <Route path="/feedback" element={<ProtectedRoute><AppLayout><FeedbackPage /></AppLayout></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute adminOnly><AppLayout><InsightsPage /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
      </Routes>
    </div>
  );
}

/* ================= HEADER ================= */
function Header() {
  const { t }                      = useTranslation();
  const { theme, toggleTheme }     = useTheme();
  const isDark                     = theme === "dark";

  const ui = {
    bg:     isDark ? "rgba(10,10,10,0.88)"  : "rgba(248,250,252,0.88)",
    border: isDark ? "#1E1E1E" : "#E2E8F0",
    muted:  isDark ? "#6B7280" : "#64748B",
  };

  return (
    <header style={{
      position: "fixed", inset: "0 0 auto 0", zIndex: 40,
      borderBottom: `1px solid ${ui.border}`,
      background: ui.bg,
      backdropFilter: "blur(16px)",
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem", height: "60px",
      }}>
        {/* logo */}
        <NavLink to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <GantraLogo size="md" />
        </NavLink>

        {/* right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

          {/* language switcher */}
          <LanguageSwitcher />

          {/* theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? t("nav.lightMode") : t("nav.darkMode")}
            style={{
              width: "36px", height: "36px", borderRadius: "10px",
              border: `1px solid ${ui.border}`,
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: ui.muted, transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.muted; }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* login — only button, no request demo */}
          <NavLink to="/login" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: "10px", padding: "8px 18px",
            fontSize: "0.83rem", fontWeight: "700",
            background: "#2E8B57", color: "#fff",
            textDecoration: "none", transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#3DAA6A"}
          onMouseLeave={e => e.currentTarget.style.background = "#2E8B57"}>
            {t("navigation.login")}
          </NavLink>

        </div>
      </div>
    </header>
  );
}

/* ================= FOOTER ================= */
function Footer() {
  const { t }   = useTranslation();
  const { theme } = useTheme();
  const isDark  = theme === "dark";

  return (
    <footer style={{
      borderTop: `1px solid ${isDark ? "#1E1E1E" : "#E2E8F0"}`,
      background: isDark ? "#111111" : "#FFFFFF",
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "flex", flexDirection: "row",
        alignItems: "center", justifyContent: "space-between",
        padding: "1.25rem 1.5rem",
        fontSize: "0.75rem",
        color: isDark ? "#6B7280" : "#94A3B8",
        gap: "1rem", flexWrap: "wrap",
      }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Gantra. جميع الحقوق محفوظة.</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <NavLink to="/resources/faq" style={{ color: isDark ? "#6B7280" : "#94A3B8", textDecoration: "none" }}>
            {t("footer.faq")}
          </NavLink>
          <NavLink to="/contact-us" style={{ color: isDark ? "#6B7280" : "#94A3B8", textDecoration: "none" }}>
            {t("footer.contactUs")}
          </NavLink>
        </div>
      </div>
    </footer>
  );
}

export default App;