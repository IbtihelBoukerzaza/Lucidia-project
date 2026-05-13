import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { Sparkles, TrendingUp, Hash, Layers3, GitMerge } from "lucide-react";

const SOURCE_LABELS = {
  google_news: "Google News", rss: "RSS", reddit: "Reddit",
  youtube: "YouTube", twitter: "X / Twitter", facebook: "Facebook",
  instagram: "Instagram", tiktok: "TikTok", manual: "يدوي",
};

const SOURCE_COLORS = {
  google_news: "#4A90D9", rss: "#F59E0B", reddit: "#E53E3E",
  youtube: "#FF0000", twitter: "#38BDF8", facebook: "#4F46E5",
  instagram: "#EC4899", tiktok: "#14B8A6", manual: "#9CA3AF",
};

const TREND_COLORS = [
  "#C9A84C", "#2E8B57", "#4A90D9", "#E53E3E",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B",
];

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ── Shared UI helpers ──────────────────────────────────────────────────────── */

function Spinner({ color }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%",
        border: `2px solid ${color || "#C9A84C"}`,
        borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

function EmptyState({ label, isDark }) {
  return (
    <p style={{
      textAlign: "center", padding: "3rem 0",
      color: isDark ? "#6B7280" : "#9CA3AF",
      fontSize: "0.875rem",
    }}>
      {label}
    </p>
  );
}

function SectionCard({ icon: Icon, title, accent, isDark, children }) {
  return (
    <motion.div
      variants={fadeUp}
      style={{
        borderRadius: "24px",
        border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        background: isDark ? "#111111" : "#FFFFFF",
        padding: "1.75rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ambient blob */}
      <div style={{
        position: "absolute", top: "-40px", left: "-40px",
        width: "160px", height: "160px", borderRadius: "50%",
        background: accent, opacity: 0.04, filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      {/* top color bar */}
      <div style={{
        position: "absolute", top: 0, insetInline: 0,
        height: "3px", background: accent, borderRadius: "3px 3px 0 0",
      }} />

      {/* header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "1.5rem", position: "relative", zIndex: 1,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "38px", height: "38px", borderRadius: "12px",
          background: `${accent}18`, border: `1px solid ${accent}30`,
          color: accent, flexShrink: 0,
        }}>
          <Icon size={18} />
        </div>
        <h2 style={{
          margin: 0, fontSize: "1rem", fontWeight: "700",
          color: isDark ? "#E5E7EB" : "#111111",
        }}>
          {title}
        </h2>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
}

function FilterBtn({ active, onClick, label, accent, isDark }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px", borderRadius: "999px", fontSize: "0.78rem",
        fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
        border: active ? `1px solid ${accent}50` : `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        background: active ? `${accent}15` : "transparent",
        color: active ? accent : isDark ? "#6B7280" : "#9CA3AF",
      }}
    >
      {label}
    </button>
  );
}

/* ── Custom Tooltips ────────────────────────────────────────────────────────── */

function BarTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      borderRadius: "14px", padding: "10px 14px",
      background: isDark ? "#1A1A1A" : "#FFFFFF",
      border: `1px solid ${isDark ? "#2A2A2A" : "#E5E7EB"}`,
      fontSize: "0.82rem", textAlign: "right",
    }}>
      <p style={{ color: isDark ? "#9CA3AF" : "#6B7280", marginBottom: "4px" }} dir="auto">{label}</p>
      <p style={{ color: "#C9A84C", fontWeight: "700" }}>{payload[0].value.toLocaleString("ar-DZ")}</p>
    </div>
  );
}

function TrendTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      borderRadius: "14px", padding: "10px 14px",
      background: isDark ? "#1A1A1A" : "#FFFFFF",
      border: `1px solid ${isDark ? "#2A2A2A" : "#E5E7EB"}`,
      fontSize: "0.82rem", textAlign: "right",
    }}>
      <p style={{ color: isDark ? "#6B7280" : "#9CA3AF", marginBottom: "6px" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.stroke, margin: "2px 0" }}>
          <span dir="auto">{p.name}</span>: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ── Section 1: Top Keywords ────────────────────────────────────────────────── */

function TopKeywordsChart({ companyId, isDark, t }) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [top, setTop]       = useState(20);

  const ui = {
    muted:   isDark ? "#6B7280" : "#9CA3AF",
    surface2: isDark ? "#161616" : "#F8FAFC",
    track:   isDark ? "#1E1E1E" : "#E5E7EB",
  };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true); setError("");
    api.getTopKeywords(companyId, top)
      .then((r) => r.json())
      .then((json) => { if (json.error) throw new Error(json.error); setData(json.top || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId, top]);

  const maxCount = data[0]?.count || 1;

  return (
    <SectionCard icon={Hash} title={t("topics.topKeywords.title")} accent="#C9A84C" isDark={isDark}>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
        {[10, 20, 30].map((n) => (
          <FilterBtn key={n} active={top === n} onClick={() => setTop(n)}
            label={`${t("topics.top")} ${n}`} accent="#C9A84C" isDark={isDark} />
        ))}
      </div>

      {loading ? <Spinner color="#C9A84C" /> : error ? (
        <p style={{ color: "#F87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>
      ) : data.length === 0 ? <EmptyState label={t("topics.noData")} isDark={isDark} /> : (
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr 1fr" }}>
          {/* Bar list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.slice(0, 15).map((item, i) => (
              <motion.div key={item.word}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.7rem", color: ui.muted, width: "18px", flexShrink: 0, textAlign: "left" }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, height: "6px", borderRadius: "999px", background: ui.track, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "999px", background: "#C9A84C",
                    width: `${Math.round((item.count / maxCount) * 100)}%`,
                    opacity: 0.7 + 0.3 * (1 - i / data.length),
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <span dir="auto" style={{ fontSize: "0.82rem", fontWeight: "600", width: "110px", textAlign: "right", flexShrink: 0, color: isDark ? "#E5E7EB" : "#111111" }}>
                  {item.word}
                </span>
                <span style={{ fontSize: "0.72rem", color: ui.muted, width: "36px", textAlign: "right", flexShrink: 0 }}>
                  {item.count.toLocaleString("ar-DZ")}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Recharts bar */}
          <div style={{ height: "380px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 15)} layout="vertical"
                margin={{ left: 8, right: 20, top: 4, bottom: 4 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={ui.track} horizontal={false} />
                <XAxis type="number" tick={{ fill: ui.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="word" tick={{ fill: isDark ? "#CBD5E1" : "#374151", fontSize: 11 }}
                  axisLine={false} tickLine={false} width={80} />
                <Tooltip content={(props) => <BarTooltip {...props} isDark={isDark} />} cursor={{ fill: isDark ? "#ffffff06" : "#00000006" }} />
                <Bar dataKey="count" fill="#C9A84C" radius={[0, 4, 4, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Section 2: Keyword Trends ──────────────────────────────────────────────── */

function KeywordTrends({ companyId, isDark, t }) {
  const [data, setData]       = useState({ keywords: [], timeline: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [days, setDays]       = useState(30);
  const [topCount, setTopCount] = useState(5);

  const ui = { muted: isDark ? "#6B7280" : "#9CA3AF", track: isDark ? "#1E1E1E" : "#E5E7EB" };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true); setError("");
    api.getKeywordTrends(companyId, days, topCount)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const formatted = (json.timeline || []).map((row) => ({
          ...row,
          date: new Date(row.date).toLocaleDateString("ar-DZ", { month: "short", day: "numeric" }),
        }));
        setData({ keywords: json.keywords || [], timeline: formatted });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId, days, topCount]);

  return (
    <SectionCard icon={TrendingUp} title={t("topics.trends.title")} accent="#2E8B57" isDark={isDark}>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", borderRadius: "12px", border: `1px solid ${ui.track}`, overflow: "hidden" }}>
          {[3, 5, 8].map((n) => (
            <button key={n} onClick={() => setTopCount(n)}
              style={{
                padding: "5px 12px", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
                border: "none", background: topCount === n ? (isDark ? "#1E1E1E" : "#F1F5F9") : "transparent",
                color: topCount === n ? "#2E8B57" : ui.muted, transition: "all 0.2s",
              }}>
              {t("topics.top")} {n}
            </button>
          ))}
        </div>
        {[7, 14, 30].map((d) => (
          <FilterBtn key={d} active={days === d} onClick={() => setDays(d)}
            label={`${d} ${t("topics.days")}`} accent="#2E8B57" isDark={isDark} />
        ))}
      </div>

      {loading ? <Spinner color="#2E8B57" /> : error ? (
        <p style={{ color: "#F87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>
      ) : data.timeline.length === 0 ? <EmptyState label={t("topics.noData")} isDark={isDark} /> : (
        <div style={{ height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.timeline} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ui.track} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: ui.muted, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: ui.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={(props) => <TrendTooltip {...props} isDark={isDark} />} />
              <Legend formatter={(val) => <span style={{ fontSize: 11, color: isDark ? "#CBD5E1" : "#374151" }} dir="auto">{val}</span>} />
              {data.keywords.map((word, i) => (
                <Line key={word} type="monotone" dataKey={word}
                  stroke={TREND_COLORS[i % TREND_COLORS.length]}
                  strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Section 3: Keywords by Source ──────────────────────────────────────────── */

function KeywordsBySource({ companyId, isDark, t }) {
  const [bySource, setBySource]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState(null);

  const ui = { muted: isDark ? "#6B7280" : "#9CA3AF", track: isDark ? "#1E1E1E" : "#E5E7EB" };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true); setError("");
    api.getKeywordsBySource(companyId, 10)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const src = json.by_source || {};
        setBySource(src);
        setActiveTab(Object.keys(src)[0] || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  const sources  = Object.keys(bySource);
  const list     = activeTab ? (bySource[activeTab] || []) : [];
  const maxCount = list[0]?.count || 1;
  const accent   = SOURCE_COLORS[activeTab] || "#C9A84C";

  return (
    <SectionCard icon={Layers3} title={t("topics.bySource.title")} accent="#4A90D9" isDark={isDark}>
      {loading ? <Spinner color="#4A90D9" /> : error ? (
        <p style={{ color: "#F87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>
      ) : sources.length === 0 ? <EmptyState label={t("topics.noData")} isDark={isDark} /> : (
        <>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
            {sources.map((src) => (
              <button key={src} onClick={() => setActiveTab(src)}
                style={{
                  padding: "5px 14px", borderRadius: "999px", fontSize: "0.78rem",
                  fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                  border: activeTab === src ? `1px solid ${SOURCE_COLORS[src] || "#C9A84C"}50` : `1px solid ${ui.track}`,
                  background: activeTab === src ? `${SOURCE_COLORS[src] || "#C9A84C"}15` : "transparent",
                  color: activeTab === src ? SOURCE_COLORS[src] || "#C9A84C" : ui.muted,
                }}>
                {SOURCE_LABELS[src] || src}
              </button>
            ))}
          </div>

          {list.length === 0 ? <EmptyState label={t("topics.noData")} isDark={isDark} /> : (
            <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}>
              {list.map((item, i) => (
                <motion.div key={item.word}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.7rem", color: ui.muted, width: "16px", flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, height: "5px", borderRadius: "999px", background: ui.track, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "999px", background: accent,
                      width: `${Math.round((item.count / maxCount) * 100)}%`, opacity: 0.8,
                    }} />
                  </div>
                  <span dir="auto" style={{ fontSize: "0.82rem", fontWeight: "600", width: "100px", textAlign: "right", flexShrink: 0, color: accent }}>
                    {item.word}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: ui.muted, width: "32px", textAlign: "right", flexShrink: 0 }}>
                    {item.count.toLocaleString("ar-DZ")}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

/* ── Section 4: Co-occurrence ───────────────────────────────────────────────── */

function CoOccurrence({ companyId, isDark, t }) {
  const [pairs, setPairs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const ui = { muted: isDark ? "#6B7280" : "#9CA3AF", surface2: isDark ? "#161616" : "#F8FAFC", track: isDark ? "#1E1E1E" : "#E5E7EB" };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true); setError("");
    api.getCoOccurrence(companyId, 15)
      .then((r) => r.json())
      .then((json) => { if (json.error) throw new Error(json.error); setPairs(json.pairs || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  const maxCount = pairs[0]?.count || 1;

  return (
    <SectionCard icon={GitMerge} title={t("topics.coOccurrence.title")} accent="#8B5CF6" isDark={isDark}>
      <p style={{ fontSize: "0.78rem", color: ui.muted, textAlign: "right", marginBottom: "1.25rem", marginTop: 0 }}>
        {t("topics.coOccurrence.description")}
      </p>

      {loading ? <Spinner color="#8B5CF6" /> : error ? (
        <p style={{ color: "#F87171", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>
      ) : pairs.length === 0 ? <EmptyState label={t("topics.noData")} isDark={isDark} /> : (
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {pairs.map((pair, i) => {
            const pct = Math.round((pair.count / maxCount) * 100);
            return (
              <motion.div key={`${pair.word_a}-${pair.word_b}`}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  borderRadius: "18px", padding: "1rem",
                  background: ui.surface2, border: `1px solid ${ui.track}`,
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span dir="auto" style={{ fontSize: "0.85rem", fontWeight: "700", color: "#C9A84C" }}>{pair.word_a}</span>
                  <span style={{ color: ui.muted, fontSize: "0.75rem" }}>+</span>
                  <span dir="auto" style={{ fontSize: "0.85rem", fontWeight: "700", color: "#8B5CF6" }}>{pair.word_b}</span>
                </div>
                <div style={{ height: "5px", borderRadius: "999px", background: ui.track, overflow: "hidden", marginBottom: "8px" }}>
                  <div style={{
                    height: "100%", borderRadius: "999px", width: `${pct}%`,
                    background: "linear-gradient(to left, #8B5CF6, #C9A84C)",
                  }} />
                </div>
                <p style={{ fontSize: "0.72rem", color: ui.muted, textAlign: "center", margin: 0 }}>
                  {pair.count.toLocaleString("ar-DZ")} {t("topics.coOccurrence.sharedPosts")}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */

export default function TopicsPage() {
  const { activeCompany } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const ui = {
    bg:      isDark ? "#0A0A0A" : "#F7F6F2",
    panel:   isDark ? "#111111" : "#FFFFFF",
    border:  isDark ? "#1E1E1E" : "#E5E7EB",
    muted:   isDark ? "#6B7280" : "#9CA3AF",
    text:    isDark ? "#E5E7EB" : "#111111",
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          style={{
            position: "relative", overflow: "hidden", borderRadius: "28px",
            border: `1px solid ${ui.border}`, background: ui.panel,
            padding: "2rem 2.5rem", marginBottom: "2rem",
          }}>
          {/* blobs */}
          <div style={{ position: "absolute", left: "-60px", top: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "#C9A84C", opacity: 0.04, filter: "blur(48px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: "-60px", bottom: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "#4A90D9", opacity: 0.04, filter: "blur(48px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 14px", borderRadius: "999px",
              border: `1px solid ${isDark ? "#2A2A2A" : "#E5E7EB"}`,
              background: isDark ? "#C9A84C0D" : "#C9A84C10",
              color: "#C9A84C", fontSize: "0.78rem", fontWeight: "600",
              marginBottom: "1rem",
            }}>
              <Sparkles size={13} />
              {t("topics.badge")}
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: "900", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
              {t("topics.title")}
            </h1>

            <p style={{ fontSize: "0.88rem", lineHeight: "1.75", color: ui.muted, margin: 0, maxWidth: "600px" }}>
              {t("topics.description")}
            </p>

            {activeCompany && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                marginTop: "1rem", padding: "6px 14px", borderRadius: "999px",
                background: isDark ? "#161616" : "#F5F4F0",
                border: `1px solid ${ui.border}`, color: "#C9A84C",
                fontSize: "0.8rem", fontWeight: "700",
              }}>
                {activeCompany.name}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── SECTIONS ── */}
        {!activeCompany ? (
          <div style={{
            borderRadius: "24px", border: `1px solid ${ui.border}`,
            background: ui.panel, padding: "4rem 2rem", textAlign: "center",
            color: ui.muted,
          }}>
            {t("topics.noCompany")}
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <TopKeywordsChart companyId={activeCompany.id} isDark={isDark} t={t} />
            <KeywordTrends    companyId={activeCompany.id} isDark={isDark} t={t} />
            <KeywordsBySource companyId={activeCompany.id} isDark={isDark} t={t} />
            <CoOccurrence     companyId={activeCompany.id} isDark={isDark} t={t} />
          </motion.div>
        )}

      </div>
    </div>
  );
}