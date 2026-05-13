import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Plus, Trash2, Play, CheckCircle2,
  AlertCircle, Hash, Globe, Zap, X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";

const ACCENT = "#C9A84C";

const PLATFORMS = [
  { value: "facebook",        label: "Facebook",    color: "#4F46E5" },
  { value: "instagram",       label: "Instagram",   color: "#EC4899" },
  { value: "tiktok",          label: "TikTok",      color: "#14B8A6" },
  { value: "x",               label: "X / Twitter", color: "#9CA3AF" },
  { value: "youtube_channel", label: "YouTube",     color: "#E53E3E" },
  { value: "rss",             label: "RSS Feed",    color: "#F59E0B" },
];

const platformInfo = (value) =>
  PLATFORMS.find((p) => p.value === value) || { label: value, color: "#6B7280" };

const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ─────────────────────────────────────────
   SPINNER
───────────────────────────────────────── */

function Spinner({ color = ACCENT, size = 28 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{
        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
        border: `2px solid ${color}`, borderTopColor: "transparent",
        animation: "settingsSpin 0.7s linear infinite",
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */

function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3500);
    return () => clearTimeout(id);
  }, []);

  const color = type === "success" ? "#2E8B57" : "#E53E3E";
  const bg    = type === "success" ? "#2E8B5715" : "#E53E3E15";
  const bdr   = type === "success" ? "#2E8B5730" : "#E53E3E30";
  const Icon  = type === "success" ? CheckCircle2 : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px 14px", borderRadius: "10px",
        background: bg, border: `1px solid ${bdr}`,
        color, fontSize: "13px", fontWeight: 600,
      }}
    >
      <Icon size={14} />
      {message}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   SECTION CARD
───────────────────────────────────────── */

function SectionCard({ icon: Icon, title, desc, accent, children, isDark }) {
  const border = isDark ? "#1E1E1E" : "#E5E7EB";
  const panel  = isDark ? "#111111" : "#FFFFFF";

  return (
    <motion.div variants={fadeUp} style={{
      background: panel,
      border: `1px solid ${border}`,
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: isDark ? "0 2px 20px #00000055" : "0 2px 12px rgba(0,0,0,0.06)",
      position: "relative",
    }}>
      {/* ambient blob */}
      <div style={{
        position: "absolute", top: "-40px", left: "-40px",
        width: "140px", height: "140px", borderRadius: "50%",
        background: accent, opacity: 0.04, filter: "blur(32px)", pointerEvents: "none",
      }} />

      {/* top accent bar */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, #C9A84C, ${accent})` }} />

      {/* header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "20px 24px",
        borderBottom: `1px solid ${border}`,
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "11px", flexShrink: 0,
          background: `${accent}15`, border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center", color: accent,
        }}>
          <Icon size={18} />
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 800, margin: 0,
                      color: isDark ? "#E5E7EB" : "#111111" }}>
            {title}
          </p>
          {desc && (
            <p style={{ fontSize: "12px", color: isDark ? "#6B7280" : "#9CA3AF", margin: "2px 0 0" }}>
              {desc}
            </p>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 24px", position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   INGESTION SECTION  ← isolated state
───────────────────────────────────────── */

function IngestionSection({ activeCompany, isDark, t, ui }) {
  const [ingesting,    setIngesting]    = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingestMsg,    setIngestMsg]    = useState(null);

  const handleIngest = async () => {
    if (ingesting) return;          // guard — prevents double-click unmount race
    setIngesting(true);
    setIngestResult(null);
    setIngestMsg(null);
    try {
      const res  = await api.triggerIngestion(activeCompany.id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("settings.ingest.errorFailed"));
      setIngestResult(data.stats);
      setIngestMsg({ text: t("settings.ingest.success"), type: "success" });
    } catch (err) {
      setIngestMsg({ text: err.message || t("settings.ingest.errorUnexpected"), type: "error" });
    } finally {
      setIngesting(false);          // always reset — component stays mounted
    }
  };

  return (
    <SectionCard
      icon={Zap}
      accent="#2E8B57"
      title={t("settings.ingest.title")}
      desc={t("settings.ingest.desc")}
      isDark={isDark}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* ── Button — always rendered, never unmounts ── */}
        <button
          onClick={handleIngest}
          disabled={ingesting}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            alignSelf: "flex-start",
            padding: "12px 22px", borderRadius: "12px",
            fontSize: "14px", fontWeight: 800,
            background: ingesting
              ? (isDark ? "#1A1A1A" : "#E5E7EB")
              : "linear-gradient(135deg, #2E8B57, #3DAA6A)",
            color: ingesting ? (isDark ? "#6B7280" : "#9CA3AF") : "#fff",
            border: "none",
            cursor: ingesting ? "not-allowed" : "pointer",
            boxShadow: ingesting ? "none" : "0 4px 20px #2E8B5740",
            transition: "background 0.3s, box-shadow 0.3s, color 0.3s",
          }}
        >
          {ingesting ? (
            <>
              <div style={{
                width: "15px", height: "15px",
                border: `2px solid ${isDark ? "#6B7280" : "#9CA3AF"}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "settingsSpin 0.7s linear infinite",
                flexShrink: 0,
              }} />
              {t("settings.ingest.running")}
            </>
          ) : (
            <>
              <Play size={15} />
              {t("settings.ingest.button")}
            </>
          )}
        </button>

        {/* ── Toast ── */}
        <AnimatePresence>
          {ingestMsg && (
            <Toast
              key="ingest-toast"
              message={ingestMsg.text}
              type={ingestMsg.type}
              onDone={() => setIngestMsg(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {ingestResult && (
            <motion.div
              key="ingest-result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "16px 20px", borderRadius: "14px",
                background: isDark ? "#161616" : "#F8FAFC",
                border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
              }}
            >
              {/* Summary pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                {[
                  { label: t("settings.ingest.new"),      value: ingestResult.created,  color: "#2E8B57" },
                  { label: t("settings.ingest.existing"), value: ingestResult.existing, color: "#4A90D9" },
                  { label: t("settings.ingest.skipped"),  value: ingestResult.skipped,  color: "#6B7280" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    padding: "8px 16px", borderRadius: "10px",
                    background: `${color}12`, border: `1px solid ${color}25`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                  }}>
                    <span style={{ fontSize: "18px", fontWeight: 900, color }}>{value}</span>
                    <span style={{ fontSize: "11px", color: isDark ? "#6B7280" : "#9CA3AF" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Per-source breakdown */}
              {ingestResult.sources && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {Object.entries(ingestResult.sources).map(([source, s]) => (
                    <div key={source} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: "12px", padding: "6px 10px", borderRadius: "8px",
                      background: isDark ? "#0D0D0D" : "#F0F0F0",
                    }}>
                      <span style={{
                        color: s.error ? "#E53E3E" : s.skipped ? (isDark ? "#6B7280" : "#9CA3AF") : "#2E8B57",
                        fontSize: "11px", fontWeight: 600,
                      }}>
                        {s.skipped
                          ? t("settings.ingest.statusSkipped")
                          : s.error
                          ? t("settings.ingest.statusError")
                          : `↑${s.created} / ${s.fetched}`}
                      </span>
                      <span style={{ color: isDark ? "#E5E7EB" : "#111111", fontWeight: 600 }}>
                        {source}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionCard>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */

export default function SettingsPage() {
  const { activeCompany, isAdmin } = useAuth();
  const { theme }                  = useTheme();
  const { t }                      = useTranslation();
  const isDark                     = theme === "dark";

  const ui = {
    bg:          isDark ? "#0A0A0A" : "#F7F6F2",
    panel:       isDark ? "#111111" : "#FFFFFF",
    panel2:      isDark ? "#161616" : "#F8FAFC",
    border:      isDark ? "#1E1E1E" : "#E5E7EB",
    text:        isDark ? "#E5E7EB" : "#111111",
    muted:       isDark ? "#6B7280" : "#9CA3AF",
    input:       isDark ? "#0D0D0D" : "#F8FAFC",
    inputBorder: isDark ? "#262626" : "#D1D5DB",
  };

  const inputStyle = {
    padding: "11px 14px", borderRadius: "12px", fontSize: "13px",
    background: ui.input, border: `1px solid ${ui.inputBorder}`,
    color: ui.text, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", transition: "border-color 0.2s",
    direction: "rtl",
  };

  /* ── Keywords ── */
  const [keywords,        setKeywords]        = useState([]);
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  const [newKeyword,      setNewKeyword]      = useState("");
  const [keywordMsg,      setKeywordMsg]      = useState(null);

  /* ── Profiles ── */
  const [profiles,        setProfiles]        = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [newPlatform,     setNewPlatform]     = useState("facebook");
  const [newUrl,          setNewUrl]          = useState("");
  const [profileMsg,      setProfileMsg]      = useState(null);

  /* ── Fetch ── */
  const fetchKeywords = async () => {
    if (!activeCompany) return;
    setLoadingKeywords(true);
    try {
      const res  = await api.getKeywords(activeCompany.id);
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch {
      setKeywordMsg({ text: t("settings.keywords.errorLoad"), type: "error" });
    } finally {
      setLoadingKeywords(false);
    }
  };

  const fetchProfiles = async () => {
    if (!activeCompany) return;
    setLoadingProfiles(true);
    try {
      const res  = await api.getSocialProfiles(activeCompany.id);
      const data = await res.json();
      setProfiles(data.social_profiles || []);
    } catch {
      setProfileMsg({ text: t("settings.profiles.errorLoad"), type: "error" });
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchProfiles();
  }, [activeCompany]);

  /* ── Keyword handlers ── */
  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setKeywordMsg(null);
    try {
      const res  = await api.addKeyword(activeCompany.id, newKeyword.trim());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewKeyword("");
      setKeywordMsg({ text: t("settings.keywords.addSuccess"), type: "success" });
      await fetchKeywords();
    } catch (err) {
      setKeywordMsg({ text: err.message || t("settings.keywords.errorAdd"), type: "error" });
    }
  };

  const handleDeleteKeyword = async (keywordId) => {
    try {
      await api.deleteKeyword(activeCompany.id, keywordId);
      setKeywords(prev => prev.filter(k => k.id !== keywordId));
      setKeywordMsg({ text: t("settings.keywords.deleteSuccess"), type: "success" });
    } catch {
      setKeywordMsg({ text: t("settings.keywords.errorDelete"), type: "error" });
    }
  };

  /* ── Profile handlers ── */
  const handleAddProfile = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setProfileMsg(null);
    try {
      const res  = await api.addSocialProfile(activeCompany.id, newPlatform, newUrl.trim());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewUrl("");
      setProfileMsg({ text: t("settings.profiles.addSuccess"), type: "success" });
      await fetchProfiles();
    } catch (err) {
      setProfileMsg({ text: err.message || t("settings.profiles.errorAdd"), type: "error" });
    }
  };

  const handleDeleteProfile = async (profileId) => {
    try {
      await api.deleteSocialProfile(activeCompany.id, profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setProfileMsg({ text: t("settings.profiles.deleteSuccess"), type: "success" });
    } catch {
      setProfileMsg({ text: t("settings.profiles.errorDelete"), type: "error" });
    }
  };

  /* ── Render ── */
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>
      <style>{`@keyframes settingsSpin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "relative", overflow: "hidden",
            borderRadius: "28px", border: `1px solid ${ui.border}`,
            background: ui.panel, padding: "2rem 2.5rem", marginBottom: "2rem",
          }}
        >
          {/* blobs */}
          <div style={{
            position: "absolute", left: "-50px", top: "-50px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: ACCENT, opacity: 0.05, filter: "blur(48px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: "-50px", bottom: "-50px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "#2E8B57", opacity: 0.05, filter: "blur(48px)", pointerEvents: "none",
          }} />

          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", flexWrap: "wrap",
            alignItems: "center", justifyContent: "space-between", gap: "1.5rem",
          }}>
            <div>
              {/* badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "5px 14px", borderRadius: "99px", marginBottom: "12px",
                border: `1px solid ${ui.border}`,
                background: `${ACCENT}0E`, color: ACCENT,
                fontSize: "0.78rem", fontWeight: 700,
              }}>
                <Settings size={13} />
                {t("settings.badge")}
              </div>

              <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: "0 0 8px" }}>
                {t("settings.title")}
              </h1>
              <p style={{ fontSize: "0.88rem", color: ui.muted, margin: "0 0 12px", lineHeight: 1.6 }}>
                {t("settings.description")}
              </p>

              {activeCompany && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "6px 14px", borderRadius: "99px",
                  background: isDark ? "#161616" : "#F5F4F0",
                  border: `1px solid ${ui.border}`,
                  color: ACCENT, fontSize: "0.8rem", fontWeight: 700,
                }}>
                  {activeCompany.name}
                </div>
              )}
            </div>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "72px", height: "72px", borderRadius: "20px",
              background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`,
              color: ACCENT, flexShrink: 0,
            }}>
              <Settings size={32} />
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
            {t("settings.errors.noCompany")}
          </div>
        ) : (
          <motion.div
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >

            {/* ════ INGESTION ════ */}
            {isAdmin && (
              <IngestionSection
                activeCompany={activeCompany}
                isDark={isDark}
                t={t}
                ui={ui}
              />
            )}

            {/* ════ KEYWORDS ════ */}
            <SectionCard
              icon={Hash}
              accent={ACCENT}
              title={t("settings.keywords.title")}
              desc={t("settings.keywords.desc")}
              isDark={isDark}
            >
              {/* add form */}
              {isAdmin && (
                <form
                  onSubmit={handleAddKeyword}
                  style={{ display: "flex", gap: "10px", marginBottom: "16px" }}
                >
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    placeholder={t("settings.keywords.placeholder")}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e  => e.target.style.borderColor = ui.inputBorder}
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "0 16px", borderRadius: "12px",
                      fontSize: "13px", fontWeight: 700,
                      background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`,
                      color: ACCENT, cursor: "pointer", whiteSpace: "nowrap",
                      transition: "all 0.2s",
                    }}
                  >
                    <Plus size={14} />
                    {t("settings.keywords.add")}
                  </motion.button>
                </form>
              )}

              <AnimatePresence>
                {keywordMsg && (
                  <div style={{ marginBottom: "12px" }}>
                    <Toast
                      key="kw-toast"
                      message={keywordMsg.text}
                      type={keywordMsg.type}
                      onDone={() => setKeywordMsg(null)}
                    />
                  </div>
                )}
              </AnimatePresence>

              {loadingKeywords ? (
                <Spinner color={ACCENT} size={24} />
              ) : keywords.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "28px 0",
                  color: ui.muted, fontSize: "13px",
                }}>
                  {t("settings.keywords.empty")}
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <AnimatePresence>
                    {keywords.map(k => (
                      <motion.div
                        key={k.id}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "6px 12px", borderRadius: "10px",
                          background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`,
                          fontSize: "13px", fontWeight: 600,
                          color: isDark ? "#E5E7EB" : "#111111",
                        }}
                      >
                        <span>{k.keyword}</span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteKeyword(k.id)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#E53E3E", display: "flex", padding: "0 0 0 2px",
                              opacity: 0.6, transition: "opacity 0.2s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </SectionCard>

            {/* ════ SOCIAL PROFILES ════ */}
            <SectionCard
              icon={Globe}
              accent="#4A90D9"
              title={t("settings.profiles.title")}
              desc={t("settings.profiles.desc")}
              isDark={isDark}
            >
              {/* add form */}
              {isAdmin && (
                <form
                  onSubmit={handleAddProfile}
                  style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}
                >
                  <select
                    value={newPlatform}
                    onChange={e => setNewPlatform(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer", minWidth: "130px" }}
                    onFocus={e => e.target.style.borderColor = "#4A90D9"}
                    onBlur={e  => e.target.style.borderColor = ui.inputBorder}
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>

                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ ...inputStyle, flex: 1, minWidth: "200px", direction: "ltr" }}
                    onFocus={e => e.target.style.borderColor = "#4A90D9"}
                    onBlur={e  => e.target.style.borderColor = ui.inputBorder}
                  />

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "0 16px", borderRadius: "12px",
                      fontSize: "13px", fontWeight: 700,
                      background: "#4A90D918", border: "1px solid #4A90D935",
                      color: "#4A90D9", cursor: "pointer", whiteSpace: "nowrap",
                      transition: "all 0.2s",
                    }}
                  >
                    <Plus size={14} />
                    {t("settings.profiles.add")}
                  </motion.button>
                </form>
              )}

              <AnimatePresence>
                {profileMsg && (
                  <div style={{ marginBottom: "12px" }}>
                    <Toast
                      key="prof-toast"
                      message={profileMsg.text}
                      type={profileMsg.type}
                      onDone={() => setProfileMsg(null)}
                    />
                  </div>
                )}
              </AnimatePresence>

              {loadingProfiles ? (
                <Spinner color="#4A90D9" size={24} />
              ) : profiles.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "28px 0",
                  color: ui.muted, fontSize: "13px",
                }}>
                  {t("settings.profiles.empty")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <AnimatePresence>
                    {profiles.map(p => {
                      const info = platformInfo(p.platform);
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "12px 16px", borderRadius: "12px",
                            background: isDark ? "#161616" : "#F8FAFC",
                            border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
                          }}
                        >
                          <span style={{
                            padding: "3px 10px", borderRadius: "8px",
                            fontSize: "11px", fontWeight: 800,
                            background: `${info.color}15`, color: info.color,
                            border: `1px solid ${info.color}25`, flexShrink: 0,
                          }}>
                            {info.label}
                          </span>

                          <span style={{
                            flex: 1, fontSize: "12px", color: ui.muted,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            direction: "ltr", textAlign: "left",
                          }}>
                            {p.url}
                          </span>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProfile(p.id)}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#E53E3E", display: "flex", padding: 0, flexShrink: 0,
                                opacity: 0.6, transition: "opacity 0.2s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </SectionCard>

          </motion.div>
        )}
      </div>
    </div>
  );
}