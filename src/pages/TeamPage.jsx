import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Sparkles, Building2, UserPlus,
  Mail, User, X, CheckCircle, ShieldCheck, Eye,
} from "lucide-react";
import { api } from "../services/api";

/* ─────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────── */

function Spinner({ color = "#C9A84C" }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
      <div style={{
        width: "32px", height: "32px",
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{
      borderRadius: "16px", padding: "1rem 1.25rem",
      background: "rgba(229,62,62,0.08)",
      border: "1px solid rgba(229,62,62,0.2)",
      color: "#F87171", fontSize: "0.875rem", textAlign: "right",
    }}>
      {message}
    </div>
  );
}

/* ─────────────────────────────────────────
   INVITE MODAL
───────────────────────────────────────── */

function InviteModal({ isDark, t, companyId, onClose, onSuccess }) {
  const [email, setEmail]         = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const ui = {
    border:   isDark ? "#1E1E1E" : "#E5E7EB",
    surface:  isDark ? "#111111" : "#FFFFFF",
    surface2: isDark ? "#0A0A0A" : "#F9FAFB",
    text:     isDark ? "#E5E7EB" : "#111111",
    muted:    isDark ? "#6B7280" : "#9CA3AF",
    inputBg:  isDark ? "#0A0A0A" : "#F9FAFB",
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !firstName) {
      setError(t("team.invite.errorFields"));
      return;
    }
    setLoading(true);
    try {
      const res  = await api.inviteMember({ email, first_name: firstName, company_id: companyId });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("team.invite.errorFailed"));
      setSuccess(t("team.invite.success"));
      setEmail("");
      setFirstName("");
      onSuccess();
    } catch (err) {
      setError(err.message || t("team.invite.errorFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          padding: "1rem",
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          style={{
            width: "100%", maxWidth: "460px",
            borderRadius: "24px",
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            padding: "2rem",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* accent bar */}
          <div style={{
            position: "absolute", top: 0, right: 0, left: 0, height: "3px",
            background: "linear-gradient(90deg, #C9A84C, #4A90D9)",
          }} />
          {/* ambient blob */}
          <div style={{
            position: "absolute", top: "-40px", left: "-40px",
            width: "140px", height: "140px", borderRadius: "50%",
            background: "#4A90D9", opacity: 0.05, filter: "blur(32px)", pointerEvents: "none",
          }} />

          {/* header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "1.75rem",
            position: "relative", zIndex: 1,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "#4A90D915", border: "1px solid #4A90D930",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#4A90D9",
              }}>
                <UserPlus size={18} />
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: ui.text, margin: 0 }}>
                {t("team.invite.title")}
              </h2>
            </div>
            <button onClick={onClose}
              style={{
                width: "32px", height: "32px", borderRadius: "8px",
                border: `1px solid ${ui.border}`,
                background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: ui.muted, transition: "all 0.2s",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative", zIndex: 1 }}>

            {/* first name */}
            <div>
              <label style={{
                display: "block", fontSize: "0.75rem", fontWeight: "600",
                color: ui.muted, marginBottom: "6px", textAlign: "right",
              }}>
                {t("team.invite.firstName")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder={t("team.invite.firstNamePlaceholder")}
                  dir="rtl"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    borderRadius: "12px", padding: "10px 40px 10px 14px",
                    background: ui.inputBg,
                    border: `1px solid ${ui.border}`,
                    color: ui.text, fontSize: "0.875rem",
                    outline: "none", transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#4A90D9"}
                  onBlur={e => e.target.style.borderColor = ui.border}
                />
                <User size={15} style={{
                  position: "absolute", right: "13px", top: "50%",
                  transform: "translateY(-50%)", color: ui.muted, pointerEvents: "none",
                }} />
              </div>
            </div>

            {/* email */}
            <div>
              <label style={{
                display: "block", fontSize: "0.75rem", fontWeight: "600",
                color: ui.muted, marginBottom: "6px", textAlign: "right",
              }}>
                {t("team.invite.email")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t("team.invite.emailPlaceholder")}
                  dir="ltr"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    borderRadius: "12px", padding: "10px 40px 10px 14px",
                    background: ui.inputBg,
                    border: `1px solid ${ui.border}`,
                    color: ui.text, fontSize: "0.875rem",
                    outline: "none", transition: "border-color 0.2s",
                    textAlign: "right",
                  }}
                  onFocus={e => e.target.style.borderColor = "#4A90D9"}
                  onBlur={e => e.target.style.borderColor = ui.border}
                />
                <Mail size={15} style={{
                  position: "absolute", right: "13px", top: "50%",
                  transform: "translateY(-50%)", color: ui.muted, pointerEvents: "none",
                }} />
              </div>
            </div>

            {/* messages */}
            {error && <ErrorBox message={error} />}
            {success && (
              <div style={{
                borderRadius: "16px", padding: "0.875rem 1rem",
                background: "rgba(46,139,87,0.08)",
                border: "1px solid rgba(46,139,87,0.25)",
                color: "#2E8B57", fontSize: "0.85rem",
                display: "flex", alignItems: "center", gap: "8px",
                justifyContent: "flex-end",
              }}>
                <span>{success}</span>
                <CheckCircle size={16} />
              </div>
            )}

            {/* submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "12px",
                borderRadius: "12px", border: "none",
                background: loading ? "#4A90D960" : "linear-gradient(135deg, #4A90D9, #2E8B57)",
                color: "#fff", fontSize: "0.9rem", fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: "16px", height: "16px",
                    border: "2px solid #ffffff60",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  {t("team.invite.sending")}
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  {t("team.invite.submit")}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────
   MEMBER CARD
───────────────────────────────────────── */

function MemberCard({ member, isDark, t, index }) {
  const isAdmin  = member.role === "admin";
  const color    = isAdmin ? "#2E8B57" : "#4A90D9";
  const initials = (member.user.first_name || member.user.email || "?")
    .charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        borderRadius: "18px",
        border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        background: isDark ? "#0A0A0A" : "#F9FAFB",
        padding: "1.25rem",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "1rem",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* left accent line */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, right: 0, width: "3px",
        background: color, borderRadius: "0 18px 18px 0",
      }} />
      {/* ambient blob */}
      <div style={{
        position: "absolute", top: "-20px", left: "-20px",
        width: "80px", height: "80px", borderRadius: "50%",
        background: color, opacity: 0.04, filter: "blur(20px)",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        {/* avatar */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: `${color}15`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color, fontSize: "1.1rem", fontWeight: "800", flexShrink: 0,
        }}>
          {initials}
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={{
            fontWeight: "700", fontSize: "0.92rem",
            color: isDark ? "#E5E7EB" : "#111111",
            margin: "0 0 2px",
          }}>
            {member.user.first_name || "—"}
          </p>
          <p style={{
            fontSize: "0.78rem", color: isDark ? "#6B7280" : "#9CA3AF",
            margin: 0, direction: "ltr", textAlign: "right",
          }}>
            {member.user.email}
          </p>
        </div>
      </div>

      {/* role badge */}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "5px 12px", borderRadius: "999px",
        background: `${color}15`, border: `1px solid ${color}30`,
        color, fontSize: "0.75rem", fontWeight: "700", flexShrink: 0,
      }}>
        {isAdmin ? <ShieldCheck size={13} /> : <Eye size={13} />}
        {isAdmin ? t("team.roles.admin") : t("team.roles.analyst")}
      </span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */

export default function TeamPage() {
  const { activeCompany, isAdmin } = useAuth();
  const { theme }                  = useTheme();
  const { t }                      = useTranslation();
  const isDark                     = theme === "dark";

  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showModal, setShowModal]   = useState(false);

  const ui = {
    bg:     isDark ? "#0A0A0A" : "#F7F6F2",
    panel:  isDark ? "#111111" : "#FFFFFF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
  };

  const fetchMembers = async () => {
    if (!activeCompany) return;
    setLoading(true);
    setError("");
    try {
      const res  = await api.getMembers(activeCompany.id);
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      setError(t("team.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [activeCompany]);

  const adminCount   = members.filter(m => m.role === "admin").length;
  const analystCount = members.filter(m => m.role !== "admin").length;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "relative", overflow: "hidden",
            borderRadius: "28px",
            border: `1px solid ${ui.border}`,
            background: ui.panel,
            padding: "2rem", marginBottom: "2rem",
          }}
        >
          {/* blobs */}
          <div style={{
            position: "absolute", top: "-60px", left: "-60px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "#4A90D9", opacity: 0.06, filter: "blur(48px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-60px", right: "-60px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "#C9A84C", opacity: 0.05, filter: "blur(48px)", pointerEvents: "none",
          }} />

          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "center", gap: "1.5rem",
          }}>
            <div>
              {/* badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "5px 14px", borderRadius: "99px",
                border: `1px solid ${ui.border}`,
                background: "#4A90D910",
                color: "#4A90D9", fontSize: "0.78rem", fontWeight: "700",
                marginBottom: "1rem",
              }}>
                <Sparkles size={13} />
                {t("team.badge")}
              </div>

              <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.75rem" }}>
                {t("team.title")}
              </h1>

              <p style={{ color: ui.muted, fontSize: "0.9rem", lineHeight: "1.8", maxWidth: "500px" }}>
                {t("team.description")}
              </p>

              {activeCompany && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  marginTop: "1rem", padding: "6px 14px", borderRadius: "99px",
                  background: isDark ? "#161616" : "#F5F4F0",
                  border: `1px solid ${ui.border}`,
                  color: "#C9A84C", fontSize: "0.8rem", fontWeight: "700",
                }}>
                  <Building2 size={14} />
                  {activeCompany.name}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* summary pills */}
              {!loading && members.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{
                    padding: "6px 14px", borderRadius: "99px",
                    background: "#2E8B5715", border: "1px solid #2E8B5730",
                    color: "#2E8B57", fontSize: "0.78rem", fontWeight: "700",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}>
                    <ShieldCheck size={13} />
                    {adminCount} {t("team.roles.admin")}
                  </div>
                  <div style={{
                    padding: "6px 14px", borderRadius: "99px",
                    background: "#4A90D915", border: "1px solid #4A90D930",
                    color: "#4A90D9", fontSize: "0.78rem", fontWeight: "700",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}>
                    <Eye size={13} />
                    {analystCount} {t("team.roles.analyst")}
                  </div>
                </div>
              )}

              {/* icon */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "72px", height: "72px", borderRadius: "20px",
                background: "#4A90D915", border: "1px solid #4A90D930",
                color: "#4A90D9", flexShrink: 0,
              }}>
                <Users size={32} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── NO COMPANY ── */}
        {!activeCompany ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            borderRadius: "22px", border: `1px solid ${ui.border}`,
            background: ui.panel, color: ui.muted,
          }}>
            {t("team.errors.noCompany")}
          </div>
        ) : (
          <div style={{
            borderRadius: "22px",
            border: `1px solid ${ui.border}`,
            background: ui.panel,
            overflow: "hidden",
            position: "relative",
          }}>
            {/* top gradient bar */}
            <div style={{
              position: "absolute", top: 0, right: 0, left: 0, height: "3px",
              background: "linear-gradient(90deg, #C9A84C, #4A90D9)",
            }} />

            {/* section header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "1.5rem 1.75rem",
              borderBottom: `1px solid ${ui.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "10px",
                  background: "#4A90D915", border: "1px solid #4A90D930",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#4A90D9",
                }}>
                  <Users size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1rem", fontWeight: "800", color: ui.text, margin: 0 }}>
                    {t("team.members.title")}
                  </h2>
                  {!loading && (
                    <p style={{ fontSize: "0.72rem", color: ui.muted, margin: 0 }}>
                      {members.length} {t("team.members.count")}
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "7px",
                    padding: "8px 18px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #4A90D9, #2E8B57)",
                    color: "#fff", fontSize: "0.83rem", fontWeight: "700",
                    cursor: "pointer", transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <UserPlus size={15} />
                  {t("team.invite.button")}
                </button>
              )}
            </div>

            {/* members list */}
            <div style={{ padding: "1.25rem 1.75rem" }}>
              {loading ? (
                <Spinner color="#4A90D9" />
              ) : error ? (
                <ErrorBox message={error} />
              ) : members.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "3rem",
                  borderRadius: "16px",
                  background: isDark ? "#0A0A0A" : "#F9FAFB",
                  border: `1px solid ${ui.border}`,
                  color: ui.muted,
                }}>
                  {t("team.members.empty")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {members.map((member, i) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      isDark={isDark}
                      t={t}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* invite modal */}
      {showModal && (
        <InviteModal
          isDark={isDark}
          t={t}
          companyId={activeCompany?.id}
          onClose={() => setShowModal(false)}
          onSuccess={() => { fetchMembers(); }}
        />
      )}
    </div>
  );
}