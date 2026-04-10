import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { setAuthTokens, isAuthenticated } from "../utils/auth";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [serviceIndex, setServiceIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const services = [
    t('login.services.sentiment'),
    t('login.services.opinion'),
    t('login.services.reports'),
    t('login.services.intelligence'),
  ];

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setServiceIndex((prev) => (prev + 1) % services.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [services.length]);

  const validate = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = t('login.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('login.errors.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('login.errors.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('login.errors.passwordMinLength');
    }

    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setApiError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.message ||
          "فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.";
        throw new Error(message);
      }

      setAuthTokens({
        access: data.access,
        refresh: data.refresh,
        user: data.user,
      });

      navigate("/dashboard");
    } catch (err) {
      setApiError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const profiles = [
    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b2f3e?w=200",
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200",
  ];

  const outerRadius = 160;

  return (
    <div className="min-h-screen flex bg-slate-950 text-white overflow-hidden">
      <div className="hidden lg:flex w-1/2 items-center justify-center relative">
        <div className="absolute w-[380px] h-[380px] rounded-full border border-sky-400/20" />

        {profiles.map((img, i) => {
          const angle = (i / profiles.length) * 2 * Math.PI;
          const x = Math.cos(angle) * outerRadius;
          const y = Math.sin(angle) * outerRadius;

          return (
            <img
              key={i}
              src={img}
              alt="client"
              className="absolute w-9 h-9 rounded-full object-cover border border-white/20 shadow-md"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            />
          );
        })}

        <div className="relative w-44 h-44 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-center px-6 shadow-xl">
          <motion.div
            key={services[serviceIndex]}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sky-300 font-semibold text-lg"
          >
            {services[serviceIndex]}
          </motion.div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-md rounded-3xl bg-slate-900/70 border border-slate-800 p-10 backdrop-blur-xl shadow-[0_0_45px_rgba(56,189,248,0.25)]"
        >
          <h2 className="text-3xl font-bold text-center mb-2">تسجيل الدخول</h2>

          <p className="text-center text-slate-400 text-sm mb-8">
            {t('login.welcome')}
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition"
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 text-slate-950 hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "جارٍ الدخول..." : "دخول إلى المنصة"}
            </button>

            {apiError && (
              <p className="text-red-400 text-sm text-center">{apiError}</p>
            )}
          </form>

          <div className="text-center text-sm text-slate-400 mt-6">
            {t('login.noAccount')}{" "}
            <NavLink
              to="/request-access"
              className="text-sky-400 font-semibold hover:underline"
            >
              {t('login.createAccount')}
            </NavLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
}