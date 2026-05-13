import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Activity, Sparkles, Building2, ExternalLink,
  Heart, MessageCircle, Share2, Eye, FileText,
} from "lucide-react";
import { api } from "../services/api";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */

const PLATFORM_COLORS = {
  facebook:  "#4F46E5",
  instagram: "#EC4899",
  tiktok:    "#14B8A6",
  youtube:   "#E53E3E",
};

const PLATFORM_LABELS_MAP = {
  facebook:  "Facebook",
  instagram: "Instagram",
  tiktok:    "TikTok",
  youtube:   "YouTube",
};

function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

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

function Section({ title, children, isDark, accent = "#8B5CF6", action }) {
  return (
    <div style={{
      borderRadius: "22px",
      border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
      background: isDark ? "#111111" : "#FFFFFF",
      padding: "1.75rem",
      position: "relative", overflow: "hidden",
    }}>
      {/* top gradient bar */}
      <div style={{
        position: "absolute", top: 0, right: 0, left: 0, height: "3px",
        background: `linear-gradient(90deg, #C9A84C, ${accent})`,
      }} />
      {/* ambient blob */}
      <div style={{
        position: "absolute", top: "-40px", left: "-40px",
        width: "140px", height: "140px", borderRadius: "50%",
        background: accent, opacity: 0.04, filter: "blur(32px)", pointerEvents: "none",
      }} />
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1.25rem",
        flexWrap: "wrap", gap: "8px",
        position: "relative", zIndex: 1,
      }}>
        <h2 style={{
          fontSize: "1.05rem", fontWeight: "800",
          color: isDark ? "#E5E7EB" : "#111111",
          margin: 0,
        }}>
          {title}
        </h2>
        {action}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function PlatformBadge({ platform }) {
  const color = PLATFORM_COLORS[platform] || "#6B7280";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "999px",
      background: `${color}15`, border: `1px solid ${color}30`,
      color, fontSize: "0.72rem", fontWeight: "700",
    }}>
      {PLATFORM_LABELS_MAP[platform] || platform}
    </span>
  );
}

/* ─────────────────────────────────────────
   STATS BAR
───────────────────────────────────────── */

function StatsBar({ stats, isDark, t }) {
  if (!stats) return null;

  const cards = [
    { label: t("engagement.stats.posts"),    value: fmt(stats.totals.post_count),    color: "#8B5CF6", icon: <FileText size={18} /> },
    { label: t("engagement.stats.likes"),    value: fmt(stats.totals.like_count),    color: "#E53E3E", icon: <Heart size={18} /> },
    { label: t("engagement.stats.comments"), value: fmt(stats.totals.comment_count), color: "#C9A84C", icon: <MessageCircle size={18} /> },
    { label: t("engagement.stats.shares"),   value: fmt(stats.totals.share_count),   color: "#2E8B57", icon: <Share2 size={18} /> },
    { label: t("engagement.stats.views"),    value: fmt(stats.totals.view_count),    color: "#4A90D9", icon: <Eye size={18} /> },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "10px",
    }}>
      {cards.map((card, i) => (
        <motion.div key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          style={{
            borderRadius: "16px",
            border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
            background: isDark ? "#0A0A0A" : "#F9FAFB",
            padding: "1rem",
            textAlign: "right",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: "-20px", left: "-20px",
            width: "80px", height: "80px", borderRadius: "50%",
            background: card.color, opacity: 0.06, filter: "blur(20px)",
          }} />
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "36px", height: "36px", borderRadius: "10px",
            background: `${card.color}15`, color: card.color, marginBottom: "8px",
          }}>
            {card.icon}
          </div>
          <p style={{ fontSize: "0.72rem", color: isDark ? "#6B7280" : "#9CA3AF", margin: "0 0 2px" }}>
            {card.label}
          </p>
          <p style={{ fontSize: "1.4rem", fontWeight: "900", color: card.color, margin: 0 }}>
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   TOP POSTS BAR CHART
───────────────────────────────────────── */

function TopPostsChart({ companyId, isDark, t }) {
  const [topPosts, setTopPosts] = useState([]);
  const [metric, setMetric]     = useState("like_count");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const METRICS = [
    { value: "like_count",    label: t("engagement.metrics.likes"),    color: "#E53E3E" },
    { value: "comment_count", label: t("engagement.metrics.comments"), color: "#C9A84C" },
    { value: "share_count",   label: t("engagement.metrics.shares"),   color: "#2E8B57" },
    { value: "view_count",    label: t("engagement.metrics.views"),    color: "#4A90D9" },
  ];

  const activeMetric = METRICS.find(m => m.value === metric) || METRICS[0];

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    api.getEngagementTop(companyId, metric, 8, "")
      .then(r => r.json())
      .then(data => setTopPosts(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || t("engagement.errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [companyId, metric]);

  const barData = topPosts.map((p, i) => ({
    name:     `#${i + 1}`,
    value:    p[metric] ?? 0,
    platform: p.platform,
  }));

  const RankTick = ({ x, y, payload }) => (
    <text x={x} y={y} dy={4} textAnchor="end"
      fill={isDark ? "#4B5563" : "#9CA3AF"}
      fontSize={11} fontWeight="700">
      {payload.value}
    </text>
  );

  const BarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d     = payload[0].payload;
    const color = PLATFORM_COLORS[d.platform] || activeMetric.color;
    return (
      <div style={{
        borderRadius: "14px",
        border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
        background: isDark ? "#111111" : "#fff",
        padding: "10px 16px", fontSize: "0.8rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        textAlign: "right",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: color, display: "inline-block",
          }} />
          <span style={{ color, fontWeight: "700", fontSize: "0.75rem" }}>
            {PLATFORM_LABELS_MAP[d.platform] || d.platform}
          </span>
        </div>
        <p style={{ color: activeMetric.color, fontWeight: "800", fontSize: "1rem", margin: 0 }}>
          {fmt(payload[0].value)}
        </p>
        <p style={{ color: isDark ? "#6B7280" : "#9CA3AF", fontSize: "0.7rem", margin: "4px 0 0" }}>
          {activeMetric.label}
        </p>
      </div>
    );
  };

  const metricAction = (
    <div style={{
      display: "flex", borderRadius: "10px",
      border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
      overflow: "hidden",
    }}>
      {METRICS.map(m => (
        <button key={m.value} onClick={() => setMetric(m.value)}
          style={{
            padding: "5px 12px", fontSize: "0.75rem", fontWeight: "600",
            border: "none", cursor: "pointer",
            background: metric === m.value ? m.color : "transparent",
            color: metric === m.value ? "#fff" : isDark ? "#6B7280" : "#9CA3AF",
            transition: "all 0.2s",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  return (
    <Section title={t("engagement.topPosts.title")} isDark={isDark} accent={activeMetric.color} action={metricAction}>
      {loading ? <Spinner color={activeMetric.color} /> : error ? <ErrorBox message={error} /> :
        barData.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6B7280", padding: "2rem 0" }}>
            {t("engagement.topPosts.noData")}
          </p>
        ) : (
          <>
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" barSize={12}
                  margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke={isDark ? "#1E1E1E" : "#F3F4F6"} horizontal={false} />
                  <XAxis type="number"
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={false} tickLine={false} tickFormatter={fmt} />
                  <YAxis type="category" dataKey="name" width={28}
                    tick={<RankTick />} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />}
                    cursor={{ fill: isDark ? "#1E1E1E40" : "#F3F4F640" }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i}
                        fill={PLATFORM_COLORS[entry.platform] || activeMetric.color}
                        opacity={1 - i * 0.07}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* platform legend */}
            <div style={{
              display: "flex", gap: "14px", justifyContent: "flex-end",
              flexWrap: "wrap", marginTop: "12px",
            }}>
              {[...new Set(barData.map(d => d.platform))].map(plat => (
                <span key={plat} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.73rem" }}>
                  <span style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: PLATFORM_COLORS[plat] || "#6B7280", display: "inline-block",
                  }} />
                  <span style={{ color: PLATFORM_COLORS[plat] || "#6B7280" }}>
                    {PLATFORM_LABELS_MAP[plat] || plat}
                  </span>
                </span>
              ))}
            </div>
          </>
        )
      }
    </Section>
  );
}

/* ─────────────────────────────────────────
   PIE CHART — PLATFORM BREAKDOWN
   (mirrors SentimentPage donut + bars)
───────────────────────────────────────── */

function PlatformPieChart({ stats, isDark, t }) {
  const pieData = stats
    ? Object.entries(stats.breakdown)
        .filter(([, v]) => v.post_count > 0)
        .map(([plat, v]) => ({
          name:  PLATFORM_LABELS_MAP[plat] || plat,
          plat,
          value: v.like_count + v.comment_count + v.share_count + v.view_count,
          fill:  PLATFORM_COLORS[plat] || "#6B7280",
        }))
    : [];

  const total = pieData.reduce((s, d) => s + d.value, 0);

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d   = payload[0].payload;
    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
    return (
      <div style={{
        borderRadius: "14px", border: "1px solid #1E1E1E",
        background: "#111111", padding: "10px 16px",
        fontSize: "0.82rem", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <p style={{ color: "#9CA3AF", marginBottom: "4px" }}>{d.name}</p>
        <p style={{ color: d.fill, fontWeight: "700" }}>{fmt(d.value)}</p>
        <p style={{ color: "#6B7280" }}>{pct}%</p>
      </div>
    );
  };

  return (
    <Section title={t("engagement.platformBreakdown.title")} isDark={isDark} accent="#4A90D9">
      {pieData.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6B7280", padding: "2rem 0" }}>
          {t("engagement.platformBreakdown.noData")}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* donut — identical to SentimentPieChart */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "220px", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={58} outerRadius={95}
                    paddingAngle={4} dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* total */}
          <p style={{
            textAlign: "center", fontSize: "0.82rem",
            color: isDark ? "#6B7280" : "#9CA3AF",
          }}>
            {t("engagement.platformBreakdown.totalInteractions")}:{" "}
            <span style={{ color: "#C9A84C", fontWeight: "800", fontSize: "1.1rem" }}>
              {fmt(total)}
            </span>
          </p>

          {/* progress bars — identical to SentimentPage */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pieData.map(item => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.plat} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    width: "68px", textAlign: "right", flexShrink: 0,
                    fontSize: "0.75rem", color: item.fill, fontWeight: "700",
                  }}>
                    {item.name}
                  </span>
                  <div style={{
                    flex: 1, height: "8px", borderRadius: "99px",
                    background: isDark ? "#1E1E1E" : "#F3F4F6", overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      borderRadius: "99px", background: item.fill,
                      transition: "width 1s ease",
                    }} />
                  </div>
                  <span style={{
                    width: "36px", textAlign: "left", flexShrink: 0,
                    fontSize: "0.75rem", color: isDark ? "#6B7280" : "#9CA3AF",
                  }}>
                    {pct}%
                  </span>
                  <span style={{
                    width: "48px", textAlign: "right", flexShrink: 0,
                    fontSize: "0.72rem", color: isDark ? "#4B5563" : "#9CA3AF",
                  }}>
                    {fmt(item.value)}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </Section>
  );
}

/* ─────────────────────────────────────────
   PLATFORM CARDS
───────────────────────────────────────── */

function PlatformCards({ stats, isDark, t }) {
  if (!stats) return null;
  const entries = Object.entries(stats.breakdown).filter(([, v]) => v.post_count > 0);
  if (entries.length === 0) return null;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "12px",
    }}>
      {entries.map(([plat, v], i) => {
        const color = PLATFORM_COLORS[plat] || "#6B7280";
        const rows = [
          { icon: <Heart size={13} />,         label: t("engagement.stats.likes"),    value: v.like_count },
          { icon: <MessageCircle size={13} />,  label: t("engagement.stats.comments"), value: v.comment_count },
          { icon: <Share2 size={13} />,         label: t("engagement.stats.shares"),   value: v.share_count },
          { icon: <Eye size={13} />,            label: t("engagement.stats.views"),    value: v.view_count },
        ];

        return (
          <motion.div key={plat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              borderRadius: "18px",
              border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
              background: isDark ? "#111111" : "#FFFFFF",
              padding: "1.25rem",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* top accent */}
            <div style={{
              position: "absolute", top: 0, right: 0, left: 0, height: "3px",
              background: color,
            }} />
            {/* ambient blob */}
            <div style={{
              position: "absolute", bottom: "-30px", left: "-30px",
              width: "100px", height: "100px", borderRadius: "50%",
              background: color, opacity: 0.05, filter: "blur(24px)",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: color, flexShrink: 0,
              }} />
              <span style={{ fontWeight: "700", fontSize: "0.9rem", color: isDark ? "#E5E7EB" : "#111" }}>
                {PLATFORM_LABELS_MAP[plat] || plat}
              </span>
              <span style={{ marginRight: "auto", fontSize: "0.7rem", color: isDark ? "#6B7280" : "#9CA3AF" }}>
                {v.post_count} {t("engagement.stats.posts")}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {rows.map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    color: isDark ? "#6B7280" : "#9CA3AF", fontSize: "0.75rem",
                  }}>
                    <span style={{ color }}>{row.icon}</span>
                    {row.label}
                  </span>
                  <span style={{ fontWeight: "700", fontSize: "0.82rem", color: isDark ? "#E5E7EB" : "#111" }}>
                    {fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   POSTS TABLE
───────────────────────────────────────── */

function PostsTable({ companyId, isDark, t }) {
  const [allPosts, setAllPosts] = useState([]);
  const [platform, setPlatform] = useState("");
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const fetchPosts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const res  = await api.getEngagement(companyId, platform, page);
      const data = await res.json();
      setAllPosts(data.results || []);
      setTotal(data.num_pages || 1);
    } catch (err) {
      setError(err.message || t("engagement.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [companyId, platform, page]);

  useEffect(() => { setPage(1); }, [platform, companyId]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const platformFilter = (
    <div style={{
      display: "flex", borderRadius: "10px",
      border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
      overflow: "hidden",
    }}>
      {[
        { value: "", label: t("engagement.table.allPlatforms") },
        ...Object.entries(PLATFORM_LABELS_MAP).map(([v, l]) => ({ value: v, label: l })),
      ].map(opt => (
        <button key={opt.value} onClick={() => setPlatform(opt.value)}
          style={{
            padding: "5px 12px", fontSize: "0.75rem", fontWeight: "600",
            border: "none", cursor: "pointer",
            background: platform === opt.value
              ? (opt.value ? PLATFORM_COLORS[opt.value] : "#8B5CF6") : "transparent",
            color: platform === opt.value ? "#fff" : isDark ? "#6B7280" : "#9CA3AF",
            transition: "all 0.2s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const headerCols = [
    { label: t("engagement.table.platform"), align: "right" },
    { label: t("engagement.table.link"),     align: "right" },
    { label: <Heart size={13} />,             align: "center" },
    { label: <MessageCircle size={13} />,     align: "center" },
    { label: <Share2 size={13} />,            align: "center" },
    { label: <Eye size={13} />,               align: "center" },
    { label: t("engagement.table.date"),      align: "center" },
  ];

  return (
    <Section title={t("engagement.table.title")} isDark={isDark} accent="#2E8B57" action={platformFilter}>
      {loading ? <Spinner color="#2E8B57" /> : error ? <ErrorBox message={error} /> : (
        <>
          <div style={{
            overflowX: "auto", borderRadius: "14px",
            border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}` }}>
                  {headerCols.map((col, i) => (
                    <th key={i} style={{
                      padding: "10px 14px",
                      textAlign: col.align,
                      fontSize: "0.72rem", fontWeight: "700",
                      color: isDark ? "#4B5563" : "#9CA3AF",
                      whiteSpace: "nowrap",
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#6B7280" }}>
                      {t("engagement.table.noData")}
                    </td>
                  </tr>
                ) : allPosts.map(p => (
                  <motion.tr key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      borderBottom: `1px solid ${isDark ? "#1E1E1E" : "#F3F4F6"}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "#161616" : "#F9FAFB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <PlatformBadge platform={p.platform} />
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: "240px" }}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          color: "#8B5CF6", textDecoration: "none", fontWeight: "600",
                          fontSize: "0.8rem",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                        title={p.title || p.url}
                      >
                        <ExternalLink size={11} style={{ flexShrink: 0 }} />
                        {p.title || t("engagement.table.viewPost")}
                      </a>
                    </td>
                    {[p.like_count, p.comment_count, p.share_count, p.view_count].map((val, i) => (
                      <td key={i} style={{
                        padding: "10px 14px", textAlign: "center",
                        fontWeight: "600", color: isDark ? "#E5E7EB" : "#111",
                      }}>
                        {fmt(val)}
                      </td>
                    ))}
                    <td style={{
                      padding: "10px 14px", textAlign: "center",
                      fontSize: "0.72rem", color: isDark ? "#6B7280" : "#9CA3AF",
                    }}>
                      {formatDate(p.fetched_at || p.created_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{
                  padding: "7px 18px", borderRadius: "10px", fontSize: "0.8rem",
                  border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
                  background: "transparent", color: isDark ? "#E5E7EB" : "#111",
                  cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1,
                }}>
                {t("engagement.table.prev")} ←
              </button>
              <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>
                {t("engagement.table.page")} {page} {t("engagement.table.of")} {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{
                  padding: "7px 18px", borderRadius: "10px", fontSize: "0.8rem",
                  border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
                  background: "transparent", color: isDark ? "#E5E7EB" : "#111",
                  cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1,
                }}>
                → {t("engagement.table.next")}
              </button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */

export default function EngagementPage() {
  const { activeCompany } = useAuth();
  const { theme }         = useTheme();
  const { t }             = useTranslation();
  const isDark            = theme === "dark";

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!activeCompany) return;
    setLoading(true);
    api.getEngagementStats(activeCompany.id)
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setStats(data); })
      .catch(err => setError(err.message || t("engagement.errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [activeCompany]);

  const ui = {
    bg:     isDark ? "#0A0A0A" : "#F7F6F2",
    panel:  isDark ? "#111111" : "#FFFFFF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

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
          {/* ambient blobs */}
          <div style={{
            position: "absolute", top: "-60px", left: "-60px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "#8B5CF6", opacity: 0.06, filter: "blur(48px)", pointerEvents: "none",
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
                background: "#8B5CF610",
                color: "#8B5CF6", fontSize: "0.78rem", fontWeight: "700",
                marginBottom: "1rem",
              }}>
                <Sparkles size={13} />
                {t("engagement.badge")}
              </div>

              <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.75rem" }}>
                {t("engagement.title")}
              </h1>

              <p style={{ color: ui.muted, fontSize: "0.9rem", lineHeight: "1.8", maxWidth: "600px" }}>
                {t("engagement.description")}
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

            {/* icon badge */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "72px", height: "72px", borderRadius: "20px",
              background: "#8B5CF615", border: "1px solid #8B5CF630",
              color: "#8B5CF6", flexShrink: 0,
            }}>
              <Activity size={32} />
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
            {t("engagement.errors.noCompany")}
          </div>
        ) : loading ? (
          <Spinner color="#8B5CF6" />
        ) : error ? (
          <ErrorBox message={error} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Stats Bar */}
            <StatsBar stats={stats} isDark={isDark} t={t} />

            {/* Charts Row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}>
              <TopPostsChart companyId={activeCompany.id} isDark={isDark} t={t} />
              <PlatformPieChart stats={stats} isDark={isDark} t={t} />
            </div>

            {/* Platform Cards */}
            <PlatformCards stats={stats} isDark={isDark} t={t} />

            {/* Posts Table */}
            <PostsTable companyId={activeCompany.id} isDark={isDark} t={t} />

          </div>
        )}
      </div>
    </div>
  );
}