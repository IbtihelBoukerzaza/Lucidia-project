import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  HeartPulse, Sparkles, Building2, ExternalLink,
  TrendingUp, MessageSquareText, Clock,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { api } from "../services/api";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */

const SENTIMENT_COLORS = {
  positive: "#2E8B57",
  neutral:  "#4A90D9",
  negative: "#E53E3E",
};

const SOURCE_COLORS = {
  google_news: "#4A90D9",
  rss:         "#F59E0B",
  reddit:      "#E53E3E",
  youtube:     "#FF0000",
  twitter:     "#38BDF8",
  facebook:    "#4F46E5",
  instagram:   "#EC4899",
  tiktok:      "#14B8A6",
  manual:      "#6B7280",
};

const SOURCE_LABELS = {
  google_news: "Google News",
  rss:         "RSS",
  reddit:      "Reddit",
  youtube:     "YouTube",
  twitter:     "X / Twitter",
  facebook:    "Facebook",
  instagram:   "Instagram",
  tiktok:      "TikTok",
  manual:      "يدوي",
};

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
      borderRadius: "16px",
      padding: "1rem 1.25rem",
      background: "rgba(229,62,62,0.08)",
      border: "1px solid rgba(229,62,62,0.2)",
      color: "#F87171",
      fontSize: "0.875rem",
      textAlign: "right",
    }}>
      {message}
    </div>
  );
}

function SentimentBadge({ sentiment, t }) {
  if (!sentiment) return null;
  const color = SENTIMENT_COLORS[sentiment] || "#6B7280";
  const label = t(`sentiment.distribution.${sentiment}`, sentiment);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "999px",
      background: `${color}15`, border: `1px solid ${color}30`,
      color, fontSize: "0.72rem", fontWeight: "700",
    }}>
      {label}
    </span>
  );
}

function SourceBadge({ source }) {
  const color = SOURCE_COLORS[source] || "#6B7280";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "999px",
      background: `${color}15`, border: `1px solid ${color}30`,
      color, fontSize: "0.72rem", fontWeight: "700",
    }}>
      {SOURCE_LABELS[source] || source}
    </span>
  );
}

function Section({ title, children, isDark }) {
  return (
    <div style={{
      borderRadius: "22px",
      border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
      background: isDark ? "#111111" : "#FFFFFF",
      padding: "1.75rem",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0, left: 0, height: "3px",
        background: "linear-gradient(90deg, #C9A84C, #2E8B57)",
      }} />
      <h2 style={{
        fontSize: "1.05rem", fontWeight: "800",
        color: isDark ? "#E5E7EB" : "#111111",
        marginBottom: "1.25rem", textAlign: "right",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   PIE CHART
───────────────────────────────────────── */

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  const color = SENTIMENT_COLORS[name] || "#6B7280";
  return (
    <div style={{
      borderRadius: "14px",
      border: "1px solid #1E1E1E",
      background: "#111111",
      padding: "10px 16px",
      fontSize: "0.82rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <p style={{ color: "#9CA3AF", marginBottom: "4px" }}>{name}</p>
      <p style={{ color, fontWeight: "700" }}>{value.toLocaleString()} منشور</p>
      <p style={{ color: "#6B7280" }}>{p.percentage}%</p>
    </div>
  );
}

function SentimentPieChart({ companyId, isDark, t }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    api.getSentimentDashboard(companyId)
      .then(r => r.json())
      .then(json => { if (json.error) throw new Error(json.error); setData(json); })
      .catch(err => setError(err.message || t("sentiment.errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [companyId]);

  const title = t("sentiment.distribution.title");

  if (loading) return <Section title={title} isDark={isDark}><Spinner /></Section>;
  if (error)   return <Section title={title} isDark={isDark}><ErrorBox message={error} /></Section>;
  if (!data)   return null;

  const { distribution, total } = data;
  const pieData = ["positive", "neutral", "negative"].map(key => ({
    name:       t(`sentiment.distribution.${key}`),
    key,
    value:      distribution[key]?.count      || 0,
    percentage: distribution[key]?.percentage || 0,
  }));

  return (
    <Section title={title} isDark={isDark}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* donut */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "220px", height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={58} outerRadius={95}
                  paddingAngle={4} dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={SENTIMENT_COLORS[entry.key]}
                      opacity={0.9}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* total */}
        <p style={{
          textAlign: "center", fontSize: "0.82rem",
          color: isDark ? "#6B7280" : "#9CA3AF",
        }}>
          {t("sentiment.distribution.total")}:{" "}
          <span style={{ color: "#C9A84C", fontWeight: "800", fontSize: "1.1rem" }}>
            {total?.toLocaleString()}
          </span>
        </p>

        {/* bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {pieData.map(item => (
            <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                width: "56px", textAlign: "right", flexShrink: 0,
                fontSize: "0.75rem", color: SENTIMENT_COLORS[item.key], fontWeight: "700",
              }}>
                {item.name}
              </span>
              <div style={{
                flex: 1, height: "8px", borderRadius: "99px",
                background: isDark ? "#1E1E1E" : "#F3F4F6", overflow: "hidden",
              }}>
                <div style={{
                  width: `${item.percentage}%`, height: "100%",
                  borderRadius: "99px",
                  background: SENTIMENT_COLORS[item.key],
                  transition: "width 1s ease",
                }} />
              </div>
              <span style={{
                width: "36px", textAlign: "left", flexShrink: 0,
                fontSize: "0.75rem", color: isDark ? "#6B7280" : "#9CA3AF",
              }}>
                {item.percentage}%
              </span>
              <span style={{
                width: "48px", textAlign: "right", flexShrink: 0,
                fontSize: "0.72rem", color: isDark ? "#4B5563" : "#9CA3AF",
              }}>
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────
   TIMELINE
───────────────────────────────────────── */

function CustomChartTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      borderRadius: "14px", border: "1px solid #1E1E1E",
      background: "#111111", padding: "10px 16px",
      fontSize: "0.8rem", textAlign: "right",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <p style={{ color: "#6B7280", fontSize: "0.72rem", marginBottom: "6px" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: SENTIMENT_COLORS[p.dataKey], margin: "2px 0" }}>
          {t(`sentiment.distribution.${p.dataKey}`, p.dataKey)}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function SentimentTimeline({ companyId, isDark, t }) {
  const [timeline, setTimeline]   = useState([]);
  const [dashData, setDashData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [days, setDays]           = useState(30);
  const [chartType, setChartType] = useState("line");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      api.getSentimentTimeline(companyId, days).then(r => r.json()),
      api.getSentimentDashboard(companyId).then(r => r.json()),
    ])
      .then(([tJson, dJson]) => {
        if (tJson.error) throw new Error(tJson.error);
        setTimeline((tJson.timeline || []).map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString("ar-DZ", { month: "short", day: "numeric" }),
        })));
        setDashData(dJson);
      })
      .catch(err => setError(err.message || t("sentiment.errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [companyId, days]);

  const total         = dashData?.total || 0;
  const positiveCount = dashData?.distribution?.positive?.count || 0;
  const positiveRate  = total > 0 ? Math.round((positiveCount / total) * 100) : 0;
  const lastDate      = timeline.length > 0 ? timeline[timeline.length - 1].date : "--";

  const statCards = [
    {
      label: t("sentiment.stats.totalPosts"),
      value: total.toLocaleString(),
      sub:   t("sentiment.stats.totalPostsSub"),
      color: "#4A90D9", icon: <MessageSquareText size={18} />,
    },
    {
      label: t("sentiment.stats.positiveRate"),
      value: `${positiveRate}%`,
      sub:   t("sentiment.stats.positiveRateSub"),
      color: "#2E8B57", icon: <TrendingUp size={18} />,
    },
    {
      label: t("sentiment.stats.lastUpdate"),
      value: lastDate,
      sub:   t("sentiment.stats.lastUpdateSub"),
      color: "#C9A84C", icon: <Clock size={18} />,
    },
  ];

  const legendFormatter = val => (
    <span style={{ color: SENTIMENT_COLORS[val], fontSize: 11 }}>
      {t(`sentiment.distribution.${val}`, val)}
    </span>
  );

  return (
    <Section title={t("sentiment.timeline.title")} isDark={isDark}>
      {/* controls */}
      <div style={{
        display: "flex", justifyContent: "flex-end",
        gap: "8px", flexWrap: "wrap", marginBottom: "1.25rem",
      }}>
        {/* chart type */}
        <div style={{
          display: "flex", borderRadius: "10px",
          border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
          overflow: "hidden",
        }}>
          {["line", "bar"].map(type => (
            <button key={type}
              onClick={() => setChartType(type)}
              style={{
                padding: "5px 14px", fontSize: "0.78rem", fontWeight: "600",
                border: "none", cursor: "pointer",
                background: chartType === type
                  ? "#C9A84C" : "transparent",
                color: chartType === type
                  ? "#0A0A0A" : isDark ? "#6B7280" : "#9CA3AF",
                transition: "all 0.2s",
              }}
            >
              {type === "line" ? t("sentiment.timeline.line") : t("sentiment.timeline.bar")}
            </button>
          ))}
        </div>

        {/* days */}
        {[7, 14, 30].map(d => (
          <button key={d}
            onClick={() => setDays(d)}
            style={{
              padding: "5px 14px", fontSize: "0.78rem", fontWeight: "600",
              borderRadius: "10px", border: "1px solid",
              cursor: "pointer", transition: "all 0.2s",
              borderColor: days === d ? "#C9A84C40" : isDark ? "#1E1E1E" : "#E5E7EB",
              background:  days === d ? "#C9A84C15" : "transparent",
              color:       days === d ? "#C9A84C" : isDark ? "#6B7280" : "#9CA3AF",
            }}
          >
            {t(`sentiment.timeline.days${d}`)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
          {/* chart */}
          {timeline.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6B7280", padding: "2rem 0" }}>
              {t("sentiment.timeline.noData")}
            </p>
          ) : (
            <div style={{ height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <AreaChart data={timeline}>
                    <defs>
                      {["positive", "neutral", "negative"].map(s => (
                        <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SENTIMENT_COLORS[s]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={SENTIMENT_COLORS[s]} stopOpacity={0.0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1E1E1E" : "#F3F4F6"} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomChartTooltip t={t} />} />
                    <Legend formatter={legendFormatter} />
                    {["positive", "neutral", "negative"].map(s => (
                      <Area key={s} type="monotone" dataKey={s}
                        stroke={SENTIMENT_COLORS[s]} strokeWidth={2}
                        fill={`url(#grad-${s})`} dot={false}
                        activeDot={{ r: 4, fill: SENTIMENT_COLORS[s] }}
                      />
                    ))}
                  </AreaChart>
                ) : (
                  <BarChart data={timeline} barSize={6} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1E1E1E" : "#F3F4F6"} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomChartTooltip t={t} />} cursor={{ fill: isDark ? "#1E1E1E" : "#F3F4F6" }} />
                    <Legend formatter={legendFormatter} />
                    {["positive", "neutral", "negative"].map(s => (
                      <Bar key={s} dataKey={s} fill={SENTIMENT_COLORS[s]} radius={[3, 3, 0, 0]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {statCards.map(card => (
              <div key={card.label} style={{
                borderRadius: "16px",
                border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
                background: isDark ? "#0A0A0A" : "#F9FAFB",
                padding: "1rem",
                textAlign: "right",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: `${card.color}15`, color: card.color,
                  marginBottom: "8px",
                }}>
                  {card.icon}
                </div>
                <p style={{ fontSize: "0.72rem", color: isDark ? "#6B7280" : "#9CA3AF", marginBottom: "2px" }}>
                  {card.label}
                </p>
                <p style={{ fontSize: "1.25rem", fontWeight: "800", color: card.color }}>
                  {card.value}
                </p>
                <p style={{ fontSize: "0.68rem", color: isDark ? "#4B5563" : "#9CA3AF" }}>
                  {card.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ─────────────────────────────────────────
   WORD CLOUD
───────────────────────────────────────── */

function WordCloud({ companyId, isDark, t }) {
  const [words, setWords]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    api.getSentimentKeywords(companyId, 30)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        const raw = json.keywords || {};
        const merged = [];
        ["positive", "neutral", "negative"].forEach(s => {
          (raw[s] || []).forEach(item => merged.push({ ...item, sentiment: s }));
        });
        const seen = new Map();
        merged.forEach(item => {
          if (!seen.has(item.word) || seen.get(item.word).count < item.count)
            seen.set(item.word, item);
        });
        const sorted = [...seen.values()].sort((a, b) => b.count - a.count);
        setWords(sorted.map((item, i) => ({ item, sort: i + (Math.random() - 0.5) * 3 }))
          .sort((a, b) => a.sort - b.sort).map(x => x.item));
      })
      .catch(err => setError(err.message || t("sentiment.errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [companyId]);

  const maxCount = words.length ? Math.max(...words.map(w => w.count)) : 1;
  const minCount = words.length ? Math.min(...words.map(w => w.count)) : 0;
  const getSize    = c => maxCount === minCount ? 28 : Math.round(13 + ((c - minCount) / (maxCount - minCount)) * 38);
  const getOpacity = c => maxCount === minCount ? 0.9 : 0.45 + ((c - minCount) / (maxCount - minCount)) * 0.55;

  return (
    <Section title={t("sentiment.wordCloud.title")} isDark={isDark}>
      {/* legend */}
      <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", marginBottom: "1rem" }}>
        {["positive", "neutral", "negative"].map(s => (
          <span key={s} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: SENTIMENT_COLORS[s], display: "inline-block" }} />
            <span style={{ color: SENTIMENT_COLORS[s] }}>{t(`sentiment.distribution.${s}`)}</span>
          </span>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> :
        words.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6B7280", padding: "2rem 0" }}>
            {t("sentiment.wordCloud.noData")}
          </p>
        ) : (
          <>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "12px 16px",
              justifyContent: "center", alignItems: "center",
              borderRadius: "18px",
              background: isDark ? "#0A0A0A" : "#F9FAFB",
              border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
              padding: "2rem 1.5rem", minHeight: "180px",
            }} dir="rtl">
              {words.map((word, i) => {
                const color = SENTIMENT_COLORS[word.sentiment];
                return (
                  <motion.span key={`${word.word}-${word.sentiment}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: getOpacity(word.count), scale: 1 }}
                    transition={{ delay: i * 0.015, duration: 0.3 }}
                    whileHover={{ opacity: 1, scale: 1.2, transition: { duration: 0.15 } }}
                    title={`${word.word} — ${t(`sentiment.distribution.${word.sentiment}`)} (${word.count})`}
                    style={{
                      fontSize: `${getSize(word.count)}px`,
                      color, cursor: "default", userSelect: "none",
                      fontWeight: "600", lineHeight: 1.2,
                      textShadow: `0 0 20px ${color}40`,
                    }}
                  >
                    {word.word}
                  </motion.span>
                );
              })}
            </div>
            <p style={{ textAlign: "center", fontSize: "0.72rem", color: isDark ? "#4B5563" : "#9CA3AF", marginTop: "10px" }}>
              {t("sentiment.wordCloud.hint")}
            </p>
          </>
        )
      }
    </Section>
  );
}

/* ─────────────────────────────────────────
   POST FEED
───────────────────────────────────────── */

function PostFeed({ companyId, isDark, t }) {
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [sentiment, setSentiment] = useState("");
  const [page, setPage]           = useState(1);
  const [totalCount, setTotal]    = useState(0);
  const [hasNext, setHasNext]     = useState(false);
  const [hasPrev, setHasPrev]     = useState(false);
  const PAGE_SIZE = 10;

  const fetchPosts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const res  = await api.getSentimentPosts(companyId, { page, sentiment });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("sentiment.errors.loadFailed"));
      setPosts(data.results || []);
      setTotal(data.count || 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, page, sentiment]);

  useEffect(() => { setPage(1); }, [sentiment, companyId]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const TABS = [
    { value: "",         label: t("sentiment.feed.all") },
    { value: "positive", label: t("sentiment.feed.positive") },
    { value: "neutral",  label: t("sentiment.feed.neutral") },
    { value: "negative", label: t("sentiment.feed.negative") },
  ];

  return (
    <Section title={t("sentiment.feed.title")} isDark={isDark}>
      {/* tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
        {TABS.map(tab => {
          const active = sentiment === tab.value;
          const color  = tab.value ? SENTIMENT_COLORS[tab.value] : "#C9A84C";
          return (
            <button key={tab.value}
              onClick={() => setSentiment(tab.value)}
              style={{
                padding: "5px 16px", borderRadius: "10px", fontSize: "0.8rem",
                fontWeight: "600", border: "1px solid", cursor: "pointer",
                transition: "all 0.2s",
                borderColor: active ? `${color}40` : isDark ? "#1E1E1E" : "#E5E7EB",
                background:  active ? `${color}15` : "transparent",
                color:       active ? color : isDark ? "#6B7280" : "#9CA3AF",
              }}
            >
              {tab.label}
            </button>
          );
        })}
        {totalCount > 0 && (
          <span style={{ fontSize: "0.75rem", color: "#6B7280", alignSelf: "center", marginRight: "4px" }}>
            {totalCount.toLocaleString()} {t("sentiment.feed.posts")}
          </span>
        )}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> :
        posts.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "3rem",
            borderRadius: "16px",
            background: isDark ? "#0A0A0A" : "#F9FAFB",
            border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
            color: "#6B7280",
          }}>
            {t("sentiment.feed.noData")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {posts.map(post => {
              const scorePercent = post.sentiment_score != null
                ? Math.round(post.sentiment_score * 100) : null;
              const date = new Date(post.created_at).toLocaleDateString("ar-DZ", {
                year: "numeric", month: "short", day: "numeric",
              });
              return (
                <motion.div key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    borderRadius: "16px",
                    border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
                    background: isDark ? "#0A0A0A" : "#F9FAFB",
                    padding: "1rem 1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <SentimentBadge sentiment={post.sentiment} t={t} />
                      {scorePercent !== null && (
                        <span style={{ fontSize: "0.72rem", color: "#6B7280", alignSelf: "center" }}>
                          {scorePercent}% {t("sentiment.feed.confidence")}
                        </span>
                      )}
                      <SourceBadge source={post.source} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{date}</span>
                  </div>

                  <p dir="auto" style={{
                    fontSize: "0.875rem", lineHeight: "1.8",
                    color: isDark ? "#E5E7EB" : "#111111",
                    marginBottom: "10px",
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {post.text}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>
                      {post.author ? `@${post.author}` : ""}
                    </span>
                    {post.url && (
                      <a href={post.url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "0.75rem", color: "#C9A84C",
                          textDecoration: "none", fontWeight: "600",
                        }}
                      >
                        <ExternalLink size={12} />
                        {t("sentiment.feed.viewSource")}
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      }

      {/* pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <button onClick={() => setPage(p => p - 1)} disabled={!hasPrev}
            style={{
              padding: "7px 18px", borderRadius: "10px", fontSize: "0.8rem",
              border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
              background: "transparent", color: isDark ? "#E5E7EB" : "#111111",
              cursor: hasPrev ? "pointer" : "not-allowed", opacity: hasPrev ? 1 : 0.4,
            }}>
            {t("sentiment.feed.prev")} ←
          </button>
          <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>
            {t("sentiment.feed.page")} {page} {t("sentiment.feed.of")} {totalPages}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={!hasNext}
            style={{
              padding: "7px 18px", borderRadius: "10px", fontSize: "0.8rem",
              border: `1px solid ${isDark ? "#1E1E1E" : "#E5E7EB"}`,
              background: "transparent", color: isDark ? "#E5E7EB" : "#111111",
              cursor: hasNext ? "pointer" : "not-allowed", opacity: hasNext ? 1 : 0.4,
            }}>
            → {t("sentiment.feed.next")}
          </button>
        </div>
      )}
    </Section>
  );
}

/* ─────────────────────────────────────────
   KEYWORD BREAKDOWN
───────────────────────────────────────── */

function KeywordBreakdown({ companyId, isDark, t }) {
  const [keywords, setKeywords]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("positive");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    api.getSentimentKeywords(companyId, 10)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setKeywords(json.keywords || {});
      })
      .catch(err => setError(err.message || t("sentiment.errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [companyId]);

  const list     = keywords?.[activeTab] || [];
  const maxCount = list[0]?.count || 1;

  return (
    <Section title={t("sentiment.keywords.title")} isDark={isDark}>
      {/* tabs */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
        {["positive", "neutral", "negative"].map(tab => {
          const active = activeTab === tab;
          const color  = SENTIMENT_COLORS[tab];
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "5px 16px", borderRadius: "10px", fontSize: "0.8rem",
                fontWeight: "600", border: "1px solid", cursor: "pointer",
                transition: "all 0.2s",
                borderColor: active ? `${color}40` : isDark ? "#1E1E1E" : "#E5E7EB",
                background:  active ? `${color}15` : "transparent",
                color:       active ? color : isDark ? "#6B7280" : "#9CA3AF",
              }}
            >
              {t(`sentiment.keywords.${tab}`)}
            </button>
          );
        })}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} /> :
        list.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6B7280", padding: "2rem 0" }}>
            {t("sentiment.keywords.noData")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {list.map((item, i) => (
              <div key={item.word} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.72rem", color: "#4B5563", width: "18px", textAlign: "center", flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{
                  flex: 1, height: "6px", borderRadius: "99px",
                  background: isDark ? "#1E1E1E" : "#F3F4F6", overflow: "hidden",
                }}>
                  <div style={{
                    width: `${Math.round((item.count / maxCount) * 100)}%`,
                    height: "100%", borderRadius: "99px",
                    background: SENTIMENT_COLORS[activeTab],
                    opacity: 0.8, transition: "width 0.6s ease",
                  }} />
                </div>
                <span dir="auto" style={{
                  width: "130px", textAlign: "right", flexShrink: 0,
                  fontSize: "0.85rem", fontWeight: "600",
                  color: SENTIMENT_COLORS[activeTab],
                }}>
                  {item.word}
                </span>
                <span style={{
                  width: "40px", textAlign: "right", flexShrink: 0,
                  fontSize: "0.75rem", color: isDark ? "#6B7280" : "#9CA3AF",
                }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )
      }
    </Section>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */

export default function SentimentPage() {
  const { activeCompany } = useAuth();
  const { theme }         = useTheme();
  const { t }             = useTranslation();
  const isDark            = theme === "dark";

  const ui = {
    bg:     isDark ? "#0A0A0A" : "#F7F6F2",
    panel:  isDark ? "#111111" : "#FFFFFF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

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
            background: "#2E8B57", opacity: 0.05, filter: "blur(48px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-60px", right: "-60px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "#C9A84C", opacity: 0.05, filter: "blur(48px)", pointerEvents: "none",
          }} />

          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center", gap: "1.5rem",
          }}>
            <div>
              {/* badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "5px 14px", borderRadius: "99px",
                border: `1px solid ${ui.border}`,
                background: isDark ? "#2E8B5710" : "#2E8B5710",
                color: "#2E8B57", fontSize: "0.78rem", fontWeight: "700",
                marginBottom: "1rem",
              }}>
                <Sparkles size={13} />
                {t("sentiment.badge")}
              </div>

              <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.75rem" }}>
                {t("sentiment.title")}
              </h1>

              <p style={{ color: ui.muted, fontSize: "0.9rem", lineHeight: "1.8", maxWidth: "600px" }}>
                {t("sentiment.description")}
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
              background: "#2E8B5715", border: "1px solid #2E8B5730",
              color: "#2E8B57", flexShrink: 0,
            }}>
              <HeartPulse size={32} />
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
            {t("sentiment.errors.noCompany")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Row 1: Pie + Timeline */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}>
              <SentimentPieChart companyId={activeCompany.id} isDark={isDark} t={t} />
              <SentimentTimeline companyId={activeCompany.id} isDark={isDark} t={t} />
            </div>

            {/* Row 2: Word Cloud */}
            <WordCloud companyId={activeCompany.id} isDark={isDark} t={t} />

            {/* Row 3: Post Feed */}
            <PostFeed companyId={activeCompany.id} isDark={isDark} t={t} />

            {/* Row 4: Keywords */}
            <KeywordBreakdown companyId={activeCompany.id} isDark={isDark} t={t} />

          </div>
        )}
      </div>
    </div>
  );
}