import { useEffect, useMemo, useState } from "react";
import { useNavigate, NavLink, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { api } from "../services/api";
import gantraLogo from "../assets/gantra-logo (2).png";

export default function SetPasswordPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme }      = useTheme();
  const { t }          = useTranslation();
  const isDark         = theme === "dark";

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const [loadingVerify, setLoadingVerify] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo,   setUserInfo]   = useState(null);

  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [success,  setSuccess]  = useState("");

  const ui = {
    bg:          isDark ? "#0A0A0A"   : "#F7F6F2",
    panel:       isDark ? "#111111"   : "#FFFFFF",
    border:      isDark ? "#1E1E1E"   : "#E5E7EB",
    text:        isDark ? "#E5E7EB"   : "#111111",
    muted:       isDark ? "#6B7280"   : "#9CA3AF",
    inputBg:     isDark ? "#0A0A0A"   : "#F9FAFB",
    inputBorder: isDark ? "#1E1E1E"   : "#E5E7EB",
    surface2:    isDark ? "#161616"   : "#F8FAFC",
  };

  /* ── Token verification ── */
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setApiError(t("setPassword.invalidToken"));
        setLoadingVerify(false);
        return;
      }
      try {
        const res  = await api.verifyActivation({ token });
        const data = await res.json();
        if (!res.ok) {
          const firstKey = data?.errors ? Object.keys(data.errors)[0] : null;
          const msg      = firstKey ? data.errors[firstKey]?.[0] : null;
          throw new Error(msg || data.message || t("setPassword.invalidToken"));
        }
        setTokenValid(true);
        setUserInfo({ email: data.email, first_name: data.first_name });
      } catch (err) {
        setTokenValid(false);
        setApiError(err.message || t("setPassword.verifyFailed"));
      } finally {
        setLoadingVerify(false);
      }
    };
    verifyToken();
  }, [token]);

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (!password)             errs.password = t("setPassword.errors.passwordRequired");
    else if (password.length < 8) errs.password = t("setPassword.errors.passwordShort");
    if (!confirmPassword)      errs.confirm = t("setPassword.errors.confirmRequired");
    else if (password !== confirmPassword) errs.confirm = t("setPassword.errors.passwordMismatch");
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    setApiError("");
    setSuccess("");
    if (Object.keys(validationErrors).length > 0) return;

    setLoadingSubmit(true);
    try {
      const res  = await api.setPassword({ token, password, confirm_password: confirmPassword });
      const data = await res.json();
      if (!res.ok) {
        const firstKey = data?.errors ? Object.keys(data.errors)[0] : null;
        const msg      = firstKey ? data.errors[firstKey]?.[0] : null;
        throw new Error(msg || data.message || t("setPassword.errors.saveFailed"));
      }
      setSuccess(t("setPassword.successMessage"));
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setApiError(err.message || t("setPassword.errors.saveFailed"));
    } finally {
      setLoadingSubmit(false);
    }
  };

  /* ── Password strength ── */
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)                      s++;
    if (/[A-Z]/.test(password))                    s++;
    if (/[0-9]/.test(password))                    s++;
    if (/[^A-Za-z0-9]/.test(password))             s++;
    return s;
  })();

  const strengthColors = ["#E53E3E", "#F59E0B", "#4A90D9", "#2E8B57"];
  const strengthLabels = [
    t("setPassword.strength.weak"),
    t("setPassword.strength.fair"),
    t("setPassword.strength.good"),
    t("setPassword.strength.strong"),
  ];

  const inputStyle = (hasError) => ({
    width: "100%", boxSizing: "border-box",
    padding: "11px 42px 11px 14px",
    borderRadius: "12px", fontSize: "0.875rem",
    background: ui.inputBg,
    border: `1px solid ${hasError ? "#E53E3E" : ui.inputBorder}`,
    color: ui.text, outline: "none",
    transition: "border-color 0.2s",
    direction: "rtl",
  });

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: ui.bg, color: ui.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%", maxWidth: "440px",
          borderRadius: "28px",
          border: `1px solid ${ui.border}`,
          background: ui.panel,
          padding: "2.5rem 2rem",
          position: "relative", overflow: "hidden",
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.5)"
            : "0 24px 64px rgba(0,0,0,0.08)",
        }}
      >
        {/* top accent bar */}
        <div style={{
          position: "absolute", top: 0, right: 0, left: 0, height: "3px",
          background: "linear-gradient(90deg, #C9A84C, #2E8B57)",
        }} />

        {/* ambient blobs */}
        <div style={{
          position: "absolute", top: "-60px", left: "-60px",
          width: "180px", height: "180px", borderRadius: "50%",
          background: "#2E8B57", opacity: 0.05, filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", right: "-60px",
          width: "180px", height: "180px", borderRadius: "50%",
          background: "#C9A84C", opacity: 0.05, filter: "blur(40px)", pointerEvents: "none",
        }} />

        {/* logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem", position: "relative", zIndex: 1 }}>
          <img src={gantraLogo} alt="Gantra" style={{ height: "40px", width: "auto", objectFit: "contain" }} />
        </div>

        {/* icon + title */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px", borderRadius: "16px",
            background: "#2E8B5715", border: "1px solid #2E8B5730",
            color: "#2E8B57", marginBottom: "1rem",
          }}>
            <KeyRound size={26} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "900", margin: "0 0 6px", color: ui.text }}>
            {t("setPassword.title")}
          </h1>
          <p style={{ fontSize: "0.83rem", color: ui.muted, margin: 0, lineHeight: "1.7" }}>
            {t("setPassword.subtitle")}
          </p>
        </div>

        {/* ── LOADING ── */}
        {loadingVerify ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "12px", padding: "2rem 0", position: "relative", zIndex: 1,
          }}>
            <div style={{
              width: "28px", height: "28px",
              border: "2px solid #C9A84C", borderTopColor: "transparent",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ fontSize: "0.83rem", color: ui.muted }}>
              {t("setPassword.verifying")}
            </p>
          </div>

        /* ── INVALID TOKEN ── */
        ) : !tokenValid ? (
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              borderRadius: "16px", padding: "1.25rem",
              background: "rgba(229,62,62,0.08)",
              border: "1px solid rgba(229,62,62,0.2)",
              display: "flex", alignItems: "flex-start", gap: "10px",
              marginBottom: "1.5rem",
            }}>
              <AlertCircle size={18} style={{ color: "#F87171", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "0.83rem", color: "#F87171", margin: 0, lineHeight: "1.6" }}>
                {apiError || t("setPassword.invalidToken")}
              </p>
            </div>
            <p style={{ textAlign: "center", fontSize: "0.83rem", color: ui.muted }}>
              {t("setPassword.backTo")}{" "}
              <NavLink to="/login" style={{ color: "#C9A84C", fontWeight: "700", textDecoration: "none" }}>
                {t("setPassword.loginLink")}
              </NavLink>
            </p>
          </div>

        /* ── FORM ── */
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", zIndex: 1 }}>

            {/* user info card */}
            <div style={{
              borderRadius: "14px", padding: "12px 16px",
              background: ui.surface2, border: `1px solid ${ui.border}`,
              display: "flex", flexDirection: "column", gap: "2px",
            }}>
              <p style={{ fontSize: "0.7rem", color: ui.muted, margin: 0 }}>
                {t("setPassword.accountLabel")}
              </p>
              <p style={{ fontSize: "0.92rem", fontWeight: "700", color: "#C9A84C", margin: 0 }}>
                {userInfo?.first_name || t("setPassword.newUser")}
              </p>
              <p style={{ fontSize: "0.8rem", color: ui.muted, margin: 0, direction: "ltr", textAlign: "right" }}>
                {userInfo?.email}
              </p>
            </div>

            {/* password field */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: ui.muted, marginBottom: "6px" }}>
                {t("setPassword.passwordLabel")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t("setPassword.passwordPlaceholder")}
                  style={inputStyle(!!errors.password)}
                  onFocus={e => e.target.style.borderColor = "#2E8B57"}
                  onBlur={e  => e.target.style.borderColor = errors.password ? "#E53E3E" : ui.inputBorder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: ui.muted, display: "flex", padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* strength meter */}
              {password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: "4px", borderRadius: "99px",
                        background: i < strength ? strengthColors[strength - 1] : (isDark ? "#1E1E1E" : "#E5E7EB"),
                        transition: "background 0.3s",
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: "0.7rem", color: strengthColors[strength - 1] || ui.muted, margin: 0 }}>
                    {strength > 0 ? strengthLabels[strength - 1] : ""}
                  </p>
                </div>
              )}

              {errors.password && (
                <p style={{ fontSize: "0.72rem", color: "#F87171", margin: "4px 0 0" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* confirm password field */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: ui.muted, marginBottom: "6px" }}>
                {t("setPassword.confirmLabel")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t("setPassword.confirmPlaceholder")}
                  style={inputStyle(!!errors.confirm)}
                  onFocus={e => e.target.style.borderColor = "#2E8B57"}
                  onBlur={e  => e.target.style.borderColor = errors.confirm ? "#E53E3E" : ui.inputBorder}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: ui.muted, display: "flex", padding: 0,
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

                {/* match indicator */}
                {confirmPassword && (
                  <div style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  }}>
                    {password === confirmPassword
                      ? <CheckCircle size={15} style={{ color: "#2E8B57" }} />
                      : <AlertCircle size={15} style={{ color: "#E53E3E" }} />
                    }
                  </div>
                )}
              </div>
              {errors.confirm && (
                <p style={{ fontSize: "0.72rem", color: "#F87171", margin: "4px 0 0" }}>
                  {errors.confirm}
                </p>
              )}
            </div>

            {/* api error */}
            {apiError && (
              <div style={{
                borderRadius: "12px", padding: "10px 14px",
                background: "rgba(229,62,62,0.08)",
                border: "1px solid rgba(229,62,62,0.2)",
                display: "flex", alignItems: "center", gap: "8px",
                color: "#F87171", fontSize: "0.83rem",
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {apiError}
              </div>
            )}

            {/* success */}
            {success && (
              <div style={{
                borderRadius: "12px", padding: "10px 14px",
                background: "rgba(46,139,87,0.08)",
                border: "1px solid rgba(46,139,87,0.25)",
                display: "flex", alignItems: "center", gap: "8px",
                color: "#2E8B57", fontSize: "0.83rem",
              }}>
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                {success}
              </div>
            )}

            {/* submit */}
            <button
              onClick={handleSubmit}
              disabled={loadingSubmit}
              style={{
                width: "100%", padding: "12px",
                borderRadius: "12px", border: "none",
                background: loadingSubmit
                  ? (isDark ? "#1A1A1A" : "#E5E7EB")
                  : "linear-gradient(135deg, #2E8B57, #3DAA6A)",
                color: loadingSubmit ? ui.muted : "#fff",
                fontSize: "0.9rem", fontWeight: "700",
                cursor: loadingSubmit ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: loadingSubmit ? "none" : "0 4px 20px rgba(46,139,87,0.3)",
              }}
            >
              {loadingSubmit ? (
                <>
                  <div style={{
                    width: "16px", height: "16px",
                    border: `2px solid ${ui.muted}`, borderTopColor: "transparent",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  {t("setPassword.saving")}
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  {t("setPassword.submit")}
                </>
              )}
            </button>

            {/* login link */}
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: ui.muted, margin: 0 }}>
              {t("setPassword.backTo")}{" "}
              <NavLink to="/login" style={{ color: "#C9A84C", fontWeight: "700", textDecoration: "none" }}>
                {t("setPassword.loginLink")}
              </NavLink>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}