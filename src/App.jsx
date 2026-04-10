import "./App.css";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SurveyPage from "./pages/SurveyPage.jsx";
import FaqPage from "./pages/FaqPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import RequestDemoPage from "./pages/RequestDemoPage.jsx";
import MediaMonitoringPage from "./pages/MediaMonitoringPage.jsx";
import ProfilesPage from "./pages/ProfilesPage.jsx";
import SocialListeningPage from "./pages/SocialListeningPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import Login from "./pages/Login.jsx";
import RequestAccessPage from "./pages/RequestAccessPage.jsx";
import SetPasswordPage from "./pages/SetPasswordPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useTranslation } from 'react-i18next'
import { useLanguage } from './contexts/LanguageContext'
import HomePage from './pages/HomePage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import MediaMonitoringPage from './pages/MediaMonitoringPage.jsx'
import ProfilesPage from './pages/ProfilesPage.jsx'
import SocialListeningPage from './pages/SocialListeningPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import Login from "./pages/Login.jsx"
import RequestAccessPage from "./pages/RequestAccessPage.jsx"
import LanguageSwitcher from './components/LanguageSwitcher.jsx';

function LogoSentivya() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-sky-500/60">
        <span className="absolute inset-[3px] rounded-2xl bg-gradient-to-tr from-sky-500 via-teal-400 to-emerald-400 opacity-80" />
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="relative h-4 w-4 text-slate-950"
        >
          <path
            d="M3 13c2-4 4-6 8-6s6 2 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 17c1.2-1.6 2.4-2.4 4-2.4s2.8.8 4 2.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-tight text-slate-50">
        Sentivya<span className="text-sky-300">DZ</span>
      </span>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <SiteShell />
    </div>
  );
}

function SiteShell() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/resources/faq" element={<FaqPage />} />
            <Route path="/contact-us" element={<ContactPage />} />
            <Route path="/request-demo" element={<RequestDemoPage />} />
            <Route
              path="/products/media-monitoring"
              element={<MediaMonitoringPage />}
            />
            <Route path="/products/media-monitoring" element={<MediaMonitoringPage />} />
            <Route path="/products/profiles" element={<ProfilesPage />} />
            <Route
              path="/products/social-listening"
              element={<SocialListeningPage />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/request-access" element={<RequestAccessPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  const { t } = useTranslation()
  const { currentLang } = useLanguage()
  const navLinkBase =
    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition hover:bg-slate-800/60";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2">
          <LogoSentivya />
        </NavLink>

        <nav className="hidden items-center gap-1 text-xs font-medium text-slate-200 sm:flex">
          <NavLink
            to="/products/survey"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-slate-800 text-sky-300" : "text-slate-200"}`
            }
          >
            منتج الاستبيان
          </NavLink>

          <NavLink
            to="/products/social-listening"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-slate-800 text-sky-300" : "text-slate-200"}`
            }
          >
            {t('navigation.sentimentAnalysis')}
          </NavLink>

          <NavLink
            to="/resources/faq"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-slate-800 text-sky-300" : "text-slate-200"}`
            }
          >
            {t('navigation.faq')}
          </NavLink>

          <NavLink
            to="/contact-us"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-slate-800 text-sky-300" : "text-slate-200"}`
            }
          >
            {t('navigation.contactUs')}
          </NavLink>

          <NavLink
            to="/request-demo"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-sky-500 text-slate-950" : "bg-sky-400/90 text-slate-950 hover:bg-sky-300"}`
            }
          >
            اطلب عرضًا توضيحيًا
          </NavLink>

          {/* ✅ Login Button */}
          <NavLink
            to="/login"
            className="ml-4 inline-flex items-center justify-center rounded-full bg-green-500 px-4 py-1.5 text-sm font-semibold text-slate-950 shadow hover:bg-green-400"
          >
            {t('navigation.login')}
          </NavLink>

          {currentLang === 'ar' && (
            <LanguageSwitcher className="ml-2" />
          )}
        </nav>

        {currentLang === 'en' && (
          <div className="fixed top-3 right-4 z-50 flex items-center">
            <LanguageSwitcher />
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useTranslation()
  
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} SentivyaDZ. جميع الحقوق محفوظة.</p>

        <div className="flex flex-wrap items-center gap-4">
          <NavLink to="/products/survey" className="hover:text-slate-100">
            منتج الاستبيان
          </NavLink>

          <NavLink to="/resources/faq" className="hover:text-slate-100">
            الأسئلة الشائعة
          </NavLink>
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        <div className="flex flex-wrap items-center gap-4">
          <NavLink to="/resources/faq" className="hover:text-slate-100">
            {t('footer.faq')}
          </NavLink>
          <NavLink to="/contact-us" className="hover:text-slate-100">
            {t('footer.contactUs')}
          </NavLink>
        </div>
      </div>
    </div>
    </footer>
  );
}

export default App;
