import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { motion } from "framer-motion";
import { Sparkles, BellRing, Shield, Plus, X, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

/* ── Translation-driven constants ───────────────────────────────────────────── */

function getRuleTypes(t) {
  const keys = [
    "negative_pct_above", "positive_pct_below", "negative_count_above",
    "volume_spike", "keyword_spike", "sentiment_drop", "negative_streak",
  ];
  return keys.map((key) => ({
    value:        key,
    label:        t(`alerts.rules.types.${key}.label`),
    unit:         t(`alerts.rules.types.${key}.unit`),
    hint:         t(`alerts.rules.types.${key}.hint`),
    needsKeyword: key === "keyword_spike",
  }));
}

function getSeverityOptions(t) {
  return [
    { value: "low",    label: t("alerts.rules.severityOptions.low")    },
    { value: "medium", label: t("alerts.rules.severityOptions.medium") },
    { value: "high",   label: t("alerts.rules.severityOptions.high")   },
  ];
}

const SEVERITY_CONFIG = {
  high:   { color: "#E53E3E", bg: "rgba(229,62,62,0.1)",  border: "rgba(229,62,62,0.25)"  },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  low:    { color: "#2E8B57", bg: "rgba(46,139,87,0.1)",  border: "rgba(46,139,87,0.25)"  },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  const hour  = String(d.getHours()).padStart(2, "0");
  const min   = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${min}`;
}

function buildAlertMessage(alert, t) {
  if (!alert.rule_type) return t("alerts.notifications.messages.unknown");
  const key = `alerts.notifications.messages.${alert.rule_type}`;
  return t(key, {
    threshold: alert.threshold ?? "",
    keyword:   alert.keyword   ?? "",
    value:     alert.threshold ?? "",
  });
}

function Spinner({ color = "#C9A84C" }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        border: `2px solid ${color}`, borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

function SeverityBadge({ severity, t }) {
  const cfg   = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  const label = t(`alerts.rules.severityOptions.${severity}`, severity);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem",
      fontWeight: "700", background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color,
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

/* ── Rules Tab ──────────────────────────────────────────────────────────────── */

function RulesTab({ companyId, isDark, t }) {
  const RULE_TYPES       = getRuleTypes(t);
  const SEVERITY_OPTIONS = getSeverityOptions(t);

  const [rules,      setRules]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [ruleType,   setRuleType]   = useState(RULE_TYPES[0].value);
  const [threshold,  setThreshold]  = useState("");
  const [keyword,    setKeyword]    = useState("");
  const [severity,   setSeverity]   = useState("medium");

  const ui = {
    surface:  isDark ? "#111111" : "#FFFFFF",
    surface2: isDark ? "#161616" : "#F8FAFC",
    border:   isDark ? "#1E1E1E" : "#E5E7EB",
    muted:    isDark ? "#6B7280" : "#9CA3AF",
    text:     isDark ? "#E5E7EB" : "#111111",
    input:    isDark ? "#161616" : "#F8FAFC",
  };

  const selectedRule = RULE_TYPES.find((r) => r.value === ruleType);

  useEffect(() => {
    setLoading(true); setError("");
    api.getAlertRules(companyId)
      .then((r) => r.json())
      .then((data) => setRules(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleSubmit = async () => {
    setFormError("");
    if (!threshold || isNaN(Number(threshold))) {
      setFormError(t("alerts.rules.errorNumeric")); return;
    }
    if (selectedRule?.needsKeyword && !keyword.trim()) {
      setFormError(t("alerts.rules.errorKeyword")); return;
    }
    setSubmitting(true);
    try {
      const res  = await api.createAlertRule(companyId, {
        rule_type: ruleType, threshold: Number(threshold),
        keyword: keyword.trim(), severity,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Object.values(data).flat().join(" ") || t("alerts.rules.saving"));
      setRules((p) => [data, ...p]);
      setShowForm(false); setThreshold(""); setKeyword("");
      setSeverity("medium"); setRuleType(RULE_TYPES[0].value);
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (rule) => {
    try {
      const res  = await api.toggleAlertRule(rule.id);
      const data = await res.json();
      setRules((p) => p.map((r) => (r.id === rule.id ? data : r)));
    } catch (_) {}
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm(t("alerts.rules.deleteConfirm"))) return;
    try {
      await api.deleteAlertRule(ruleId);
      setRules((p) => p.filter((r) => r.id !== ruleId));
    } catch (_) {}
  };

  const inputStyle = {
    width: "100%", borderRadius: "14px", border: `1px solid ${ui.border}`,
    background: ui.input, color: ui.text, padding: "0.7rem 1rem",
    fontSize: "0.875rem", outline: "none", textAlign: "right",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ fontSize: "0.82rem", color: ui.muted, margin: 0 }}>
          {rules.length > 0
            ? t("alerts.rules.count", { count: rules.length })
            : t("alerts.rules.none")}
        </p>
        <button onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "12px", fontSize: "0.82rem",
            fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
            border: showForm ? `1px solid ${ui.border}` : "1px solid rgba(201,168,76,0.4)",
            background: showForm ? "transparent" : "rgba(201,168,76,0.1)",
            color: showForm ? ui.muted : "#C9A84C",
          }}>
          {showForm
            ? <><X size={14} /> {t("alerts.rules.cancel")}</>
            : <><Plus size={14} /> {t("alerts.rules.add")}</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: "20px", border: `1px solid ${ui.border}`,
            background: ui.surface, padding: "1.5rem",
            display: "flex", flexDirection: "column", gap: "1rem",
          }}>
          <div style={{ height: "3px", borderRadius: "3px", background: "#C9A84C", marginBottom: "0.25rem" }} />

          <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: ui.text, textAlign: "right" }}>
            {t("alerts.rules.newRule")}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.75rem", color: ui.muted, textAlign: "right" }}>
              {t("alerts.rules.ruleType")}
            </label>
            <select value={ruleType}
              onChange={(e) => { setRuleType(e.target.value); setKeyword(""); }}
              style={inputStyle}>
              {RULE_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {selectedRule && (
              <p style={{ fontSize: "0.72rem", color: ui.muted, textAlign: "right", margin: 0 }}>
                {selectedRule.hint}
              </p>
            )}
          </div>

          {selectedRule?.needsKeyword && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: ui.muted, textAlign: "right" }}>
                {t("alerts.rules.keyword")}
              </label>
              <input type="text" value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("alerts.rules.keywordPlaceholder")}
                dir="auto" style={inputStyle} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: ui.muted, textAlign: "right" }}>
                {t("alerts.rules.threshold_label", { unit: selectedRule?.unit || "" })}
              </label>
              <input type="number" value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                min="0" placeholder="0" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: ui.muted, textAlign: "right" }}>
                {t("alerts.rules.severity")}
              </label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={inputStyle}>
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p style={{ color: "#F87171", fontSize: "0.82rem", textAlign: "right", margin: 0 }}>
              {formError}
            </p>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            style={{
              padding: "0.75rem", borderRadius: "14px", fontSize: "0.875rem",
              fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer",
              border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.15)",
              color: "#C9A84C", opacity: submitting ? 0.6 : 1, transition: "all 0.2s",
            }}>
            {submitting ? t("alerts.rules.saving") : t("alerts.rules.save")}
          </button>
        </motion.div>
      )}

      {/* Rules list */}
      {loading ? <Spinner /> : error ? (
        <p style={{ color: "#F87171", textAlign: "center", fontSize: "0.875rem" }}>{error}</p>
      ) : rules.length === 0 ? (
        <div style={{
          borderRadius: "20px", border: `1px solid ${ui.border}`,
          background: ui.surface, padding: "3rem 1.5rem", textAlign: "center",
        }}>
          <Shield size={36} style={{ color: ui.muted, margin: "0 auto 1rem" }} />
          <p style={{ color: ui.muted, margin: "0 0 6px" }}>{t("alerts.rules.emptyTitle")}</p>
          <p style={{ fontSize: "0.75rem", color: isDark ? "#374151" : "#CBD5E1", margin: 0 }}>
            {t("alerts.rules.emptyDesc")}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rules.map((rule) => {
            const ruleInfo = RULE_TYPES.find((r) => r.value === rule.rule_type);
            return (
              <motion.div key={rule.id} variants={fadeUp}
                style={{
                  borderRadius: "20px", padding: "1.25rem",
                  border: `1px solid ${rule.is_active ? ui.border : (isDark ? "#161616" : "#F1F5F9")}`,
                  background: rule.is_active ? ui.surface : (isDark ? "#0D0D0D" : "#FAFAF8"),
                  opacity: rule.is_active ? 1 : 0.6, transition: "all 0.2s",
                  position: "relative", overflow: "hidden",
                }}>
                <div style={{
                  position: "absolute", right: 0, top: 0, bottom: 0, width: "3px",
                  background: SEVERITY_CONFIG[rule.severity]?.color || "#C9A84C",
                  borderRadius: "0 3px 3px 0",
                }} />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap", marginBottom: "6px" }}>
                      <SeverityBadge severity={rule.severity} t={t} />
                      <span style={{ fontSize: "0.875rem", fontWeight: "600", color: ui.text }}>
                        {ruleInfo?.label || rule.rule_type_display}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: ui.muted, margin: "0 0 4px" }}>
                      {t("alerts.rules.threshold")}: <span style={{ color: ui.text, fontWeight: "600" }}>{rule.threshold} {ruleInfo?.unit || ""}</span>
                      {rule.keyword && <> — {t("alerts.rules.keyword")}: <span style={{ color: "#C9A84C" }}>{rule.keyword}</span></>}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: isDark ? "#374151" : "#CBD5E1", margin: 0 }}>
                      {t("alerts.rules.createdBy")} {rule.created_by_name} — {formatDate(rule.created_at)}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <button onClick={() => handleToggle(rule)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "6px 12px", borderRadius: "10px", fontSize: "0.75rem",
                        fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                        border: rule.is_active ? "1px solid rgba(46,139,87,0.3)" : `1px solid ${ui.border}`,
                        background: rule.is_active ? "rgba(46,139,87,0.1)" : "transparent",
                        color: rule.is_active ? "#2E8B57" : ui.muted,
                      }}>
                      {rule.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {rule.is_active ? t("alerts.rules.active") : t("alerts.rules.inactive")}
                    </button>

                    <button onClick={() => handleDelete(rule.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "6px 12px", borderRadius: "10px", fontSize: "0.75rem",
                        fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                        border: "1px solid rgba(229,62,62,0.25)",
                        background: "rgba(229,62,62,0.08)", color: "#F87171",
                      }}>
                      <Trash2 size={13} />
                      {t("alerts.rules.delete")}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Notifications Tab ──────────────────────────────────────────────────────── */

function NotificationsTab({ companyId, isDark, t }) {
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const ui = {
    surface:  isDark ? "#111111" : "#FFFFFF",
    surface2: isDark ? "#161616" : "#F8FAFC",
    border:   isDark ? "#1E1E1E" : "#E5E7EB",
    muted:    isDark ? "#6B7280" : "#9CA3AF",
    text:     isDark ? "#E5E7EB" : "#111111",
  };

  useEffect(() => {
    setLoading(true); setError("");
    api.getAlerts(companyId)
      .then((r) => r.json())
      .then((data) => setAlerts(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleMarkRead = async (alert) => {
    if (alert.is_read) return;
    await api.markAlertRead(alert.id);
    setAlerts((p) => p.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a)));
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await api.markAllAlertsRead(companyId);
    setAlerts((p) => p.map((a) => ({ ...a, is_read: true })));
    setMarkingAll(false);
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ fontSize: "0.82rem", color: ui.muted, margin: 0 }}>
          {unreadCount > 0
            ? t("alerts.notifications.unread", { count: unreadCount })
            : t("alerts.notifications.allRead")}
        </p>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={markingAll}
            style={{
              padding: "8px 16px", borderRadius: "12px", fontSize: "0.82rem",
              fontWeight: "600", cursor: markingAll ? "not-allowed" : "pointer",
              border: `1px solid ${ui.border}`, background: "transparent",
              color: ui.muted, opacity: markingAll ? 0.6 : 1, transition: "all 0.2s",
            }}>
            {markingAll ? t("alerts.notifications.marking") : t("alerts.notifications.markAll")}
          </button>
        )}
      </div>

      {loading ? <Spinner /> : error ? (
        <p style={{ color: "#F87171", textAlign: "center", fontSize: "0.875rem" }}>{error}</p>
      ) : alerts.length === 0 ? (
        <div style={{
          borderRadius: "20px", border: `1px solid ${ui.border}`,
          background: ui.surface, padding: "3rem 1.5rem", textAlign: "center",
        }}>
          <BellRing size={36} style={{ color: ui.muted, margin: "0 auto 1rem" }} />
          <p style={{ color: ui.muted, margin: "0 0 6px" }}>{t("alerts.notifications.emptyTitle")}</p>
          <p style={{ fontSize: "0.75rem", color: isDark ? "#374151" : "#CBD5E1", margin: 0 }}>
            {t("alerts.notifications.emptyDesc")}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {alerts.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
            return (
              <motion.div key={alert.id} variants={fadeUp}
                onClick={() => handleMarkRead(alert)}
                style={{
                  borderRadius: "20px", padding: "1.25rem", cursor: "pointer",
                  border: `1px solid ${alert.is_read ? ui.border : cfg.border}`,
                  background: alert.is_read ? ui.surface : (isDark ? "#111111" : "#FFFFFF"),
                  transition: "all 0.2s", position: "relative", overflow: "hidden",
                }}>
                <div style={{
                  position: "absolute", right: 0, top: 0, bottom: 0, width: "3px",
                  background: cfg.color, borderRadius: "0 3px 3px 0",
                  opacity: alert.is_read ? 0.3 : 1,
                }} />

                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{
                    marginTop: "4px", width: "10px", height: "10px", borderRadius: "50%",
                    background: cfg.color, flexShrink: 0, opacity: alert.is_read ? 0.4 : 1,
                  }} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                    <p style={{ fontSize: "0.875rem", color: ui.text, lineHeight: "1.7", margin: "0 0 8px" }}>
                      {buildAlertMessage(alert, t)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <SeverityBadge severity={alert.severity} t={t} />
                      <span style={{ fontSize: "0.72rem", color: ui.muted }}>
                        {formatDateTime(alert.triggered_at)}
                      </span>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <span style={{
                      marginTop: "4px", width: "8px", height: "8px", borderRadius: "50%",
                      background: "#4A90D9", flexShrink: 0,
                    }} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */

export default function AlertsPage() {
  const { activeCompany } = useAuth();
  const { theme }         = useTheme();
  const { t }             = useTranslation();
  const isDark            = theme === "dark";
  const [activeTab, setActiveTab] = useState("rules");

  const ui = {
    bg:       isDark ? "#0A0A0A" : "#F7F6F2",
    panel:    isDark ? "#111111" : "#FFFFFF",
    border:   isDark ? "#1E1E1E" : "#E5E7EB",
    muted:    isDark ? "#6B7280" : "#9CA3AF",
    text:     isDark ? "#E5E7EB" : "#111111",
    surface2: isDark ? "#161616" : "#F8FAFC",
  };

  const TABS = [
    { key: "rules",         label: t("alerts.tabs.rules",         "القواعد"),   icon: Shield   },
    { key: "notifications", label: t("alerts.tabs.notifications", "الإشعارات"), icon: BellRing },
  ];

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* HERO */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          style={{
            position: "relative", overflow: "hidden", borderRadius: "28px",
            border: `1px solid ${ui.border}`, background: ui.panel,
            padding: "2rem 2.5rem", marginBottom: "2rem",
          }}>
          <div style={{ position: "absolute", left: "-60px", top: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "#E53E3E", opacity: 0.04, filter: "blur(48px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: "-60px", bottom: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "#C9A84C", opacity: 0.04, filter: "blur(48px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 14px", borderRadius: "999px",
              border: `1px solid ${isDark ? "#2A2A2A" : "#E5E7EB"}`,
              background: isDark ? "#E53E3E0D" : "#E53E3E10",
              color: "#E53E3E", fontSize: "0.78rem", fontWeight: "600", marginBottom: "1rem",
            }}>
              <Sparkles size={13} />
              {t("alerts.badge", "نظام التنبيهات")}
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: "900", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
              {t("alerts.title", "التنبيهات")}
            </h1>

            <p style={{ fontSize: "0.88rem", lineHeight: "1.75", color: ui.muted, margin: 0, maxWidth: "550px" }}>
              {t("alerts.description", "أنشئ قواعد تنبيه تلقائية تُطلَق بعد كل عملية جمع بيانات.")}
            </p>

            {activeCompany && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                marginTop: "1rem", padding: "6px 14px", borderRadius: "999px",
                background: ui.surface2, border: `1px solid ${ui.border}`,
                color: "#C9A84C", fontSize: "0.8rem", fontWeight: "700",
              }}>
                {activeCompany.name}
              </div>
            )}
          </div>
        </motion.div>

        {!activeCompany ? (
          <div style={{
            borderRadius: "24px", border: `1px solid ${ui.border}`,
            background: ui.panel, padding: "4rem 2rem",
            textAlign: "center", color: ui.muted,
          }}>
            {t("alerts.noCompany", "لم يتم تحديد شركة")}
          </div>
        ) : (
          <>
            {/* TABS */}
            <div style={{
              display: "flex", gap: "6px", padding: "6px",
              borderRadius: "18px", border: `1px solid ${ui.border}`,
              background: ui.surface2, width: "fit-content", marginBottom: "1.5rem",
            }}>
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 20px", borderRadius: "12px", fontSize: "0.85rem",
                    fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                    border: "none",
                    background: activeTab === key ? (isDark ? "#1E1E1E" : "#FFFFFF") : "transparent",
                    color: activeTab === key ? ui.text : ui.muted,
                    boxShadow: activeTab === key
                      ? (isDark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.08)")
                      : "none",
                  }}>
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>
              {activeTab === "rules"
                ? <RulesTab         companyId={activeCompany.id} isDark={isDark} t={t} />
                : <NotificationsTab companyId={activeCompany.id} isDark={isDark} t={t} />}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}