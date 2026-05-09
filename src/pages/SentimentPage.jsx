import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const SENTIMENT_COLORS = {
  positive: "#34d399",
  neutral:  "#94a3b8",
  negative: "#f87171",
};

const SENTIMENT_LABELS = {
  positive: "إيجابي",
  neutral:  "محايد",
  negative: "سلبي",
};

const SENTIMENT_BG = {
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  neutral:  "bg-slate-500/10 text-slate-400 border-slate-500/20",
  negative: "bg-red-500/10 text-red-400 border-red-500/20",
};

const SOURCE_COLORS = {
  google_news: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rss:         "bg-orange-500/10 text-orange-400 border-orange-500/20",
  reddit:      "bg-red-500/10 text-red-400 border-red-500/20",
  youtube:     "bg-rose-500/10 text-rose-400 border-rose-500/20",
  twitter:     "bg-sky-500/10 text-sky-400 border-sky-500/20",
  facebook:    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  instagram:   "bg-pink-500/10 text-pink-400 border-pink-500/20",
  tiktok:      "bg-teal-500/10 text-teal-400 border-teal-500/20",
  manual:      "bg-slate-500/10 text-slate-400 border-slate-500/20",
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

// ─── Shared small components ──────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-400 text-sm text-right">
      {message}
    </div>
  );
}

function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        SENTIMENT_BG[sentiment] || SENTIMENT_BG.neutral
      }`}
    >
      {SENTIMENT_LABELS[sentiment] || sentiment}
    </span>
  );
}

function SourceBadge({ source }) {
  const color =
    SOURCE_COLORS[source] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {SOURCE_LABELS[source] || source}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-100 text-right">{title}</h2>
      {children}
    </div>
  );
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm shadow-xl">
      <p className="text-slate-300">{SENTIMENT_LABELS[name] || name}</p>
      <p className="font-bold" style={{ color: SENTIMENT_COLORS[name] }}>
        {value.toLocaleString("ar-DZ")} منشور
      </p>
      <p className="text-slate-400">{p.percentage}%</p>
    </div>
  );
};

function SentimentPieChart({ companyId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .getSentimentDashboard(companyId)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <Section title="توزيع المشاعر"><Spinner /></Section>;
  if (error)   return <Section title="توزيع المشاعر"><ErrorBox message={error} /></Section>;
  if (!data)   return null;

  const { distribution, total } = data;

  const pieData = ["positive", "neutral", "negative"].map((key) => ({
    name:       key,
    value:      distribution[key]?.count      || 0,
    percentage: distribution[key]?.percentage || 0,
  }));

  return (
    <Section title="توزيع المشاعر">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Donut */}
        <div className="w-64 h-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={SENTIMENT_COLORS[entry.name]}
                    opacity={0.85}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend + bars */}
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm text-slate-400 text-right mb-4">
            إجمالي المنشورات المحلَّلة:{" "}
            <span className="text-white font-bold text-lg">
              {total?.toLocaleString("ar-DZ")}
            </span>
          </p>
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <div className="flex-1 rounded-full bg-slate-800 h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:           `${item.percentage}%`,
                    backgroundColor: SENTIMENT_COLORS[item.name],
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-left shrink-0">
                {item.percentage}%
              </span>
              <span
                className="text-xs font-medium w-20 text-right shrink-0"
                style={{ color: SENTIMENT_COLORS[item.name] }}
              >
                {SENTIMENT_LABELS[item.name]}
              </span>
              <span className="text-xs text-slate-500 w-16 text-right shrink-0">
                {item.value.toLocaleString("ar-DZ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Timeline (Line + Bar toggle) + Stat Cards ───────────────────────────────

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm shadow-xl space-y-1 text-right">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.stroke || p.fill }}>
          {SENTIMENT_LABELS[p.name] || p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function SentimentTimeline({ companyId }) {
  const [timeline,  setTimeline]  = useState([]);
  const [dashData,  setDashData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [days,      setDays]      = useState(30);
  const [chartType, setChartType] = useState("line");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");

    Promise.all([
      api.getSentimentTimeline(companyId, days).then((r) => r.json()),
      api.getSentimentDashboard(companyId).then((r) => r.json()),
    ])
      .then(([timelineJson, dashJson]) => {
        if (timelineJson.error) throw new Error(timelineJson.error);
        const formatted = (timelineJson.timeline || []).map((item) => ({
          ...item,
          date: new Date(item.date).toLocaleDateString("ar-DZ", {
            month: "short",
            day:   "numeric",
          }),
        }));
        setTimeline(formatted);
        setDashData(dashJson);
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId, days]);

  const total         = dashData?.total || 0;
  const positiveCount = dashData?.distribution?.positive?.count || 0;
  const positiveRate  = total > 0 ? Math.round((positiveCount / total) * 100) : 0;
  const lastDate      = timeline.length > 0 ? timeline[timeline.length - 1].date : "--";

  const statCards = [
    {
      label: "إجمالي المنشورات",
      value: total.toLocaleString("ar-DZ"),
      sub:   "تم تحليلها",
      color: "text-sky-400",
      bg:    "bg-sky-500/20",
      icon:  "💬",
    },
    {
      label: "نسبة الإيجابية",
      value: `${positiveRate}%`,
      sub:   "من إجمالي المنشورات",
      color: "text-emerald-400",
      bg:    "bg-emerald-500/20",
      icon:  "🎯",
    },
    {
      label: "آخر تحديث",
      value: lastDate,
      sub:   "آخر بيانات متاحة",
      color: "text-amber-400",
      bg:    "bg-amber-500/20",
      icon:  "🕐",
    },
  ];

  const legendFormatter = (val) => (
    <span style={{ color: SENTIMENT_COLORS[val], fontSize: 12 }}>
      {SENTIMENT_LABELS[val] || val}
    </span>
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-100">تطور المشاعر عبر الزمن</h2>

        <div className="flex gap-2 flex-wrap justify-end">
          {/* Chart type toggle */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 text-xs font-medium transition ${
                chartType === "line"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              خطي
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 text-xs font-medium transition ${
                chartType === "bar"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              أعمدة
            </button>
          </div>

          {/* Days selector */}
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1 text-xs font-medium border transition ${
                days === d
                  ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border-slate-700"
              }`}
            >
              {d} يوم
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart — 2 cols */}
          <div className="lg:col-span-2">
            {timeline.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SENTIMENT_COLORS.positive} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={SENTIMENT_COLORS.positive} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradNeutral" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SENTIMENT_COLORS.neutral} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={SENTIMENT_COLORS.neutral} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SENTIMENT_COLORS.negative} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={SENTIMENT_COLORS.negative} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend formatter={legendFormatter} />
                      <Area type="monotone" dataKey="positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={2} fill="url(#gradPositive)" dot={false} activeDot={{ r: 4 }} />
                      <Area type="monotone" dataKey="neutral"  stroke={SENTIMENT_COLORS.neutral}  strokeWidth={2} fill="url(#gradNeutral)"  dot={false} activeDot={{ r: 4 }} />
                      <Area type="monotone" dataKey="negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={2} fill="url(#gradNegative)" dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  ) : (
                    <BarChart data={timeline} barSize={6} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#1e293b" }} />
                      <Legend formatter={legendFormatter} />
                      <Bar dataKey="positive" fill={SENTIMENT_COLORS.positive} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="neutral"  fill={SENTIMENT_COLORS.neutral}  radius={[3, 3, 0, 0]} />
                      <Bar dataKey="negative" fill={SENTIMENT_COLORS.negative} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Stat cards — 1 col */}
          <div className="flex flex-col gap-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl ${card.bg} p-2 text-lg shrink-0`}>
                    {card.icon}
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{card.label}</p>
                    <p className={`text-lg font-semibold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-slate-500">{card.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Word Cloud ───────────────────────────────────────────────────────────────

function WordCloud({ companyId }) {
  const [words,   setWords]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .getSentimentKeywords(companyId, 30)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const raw = json.keywords || {};

        const merged = [];
        ["positive", "neutral", "negative"].forEach((sentiment) => {
          (raw[sentiment] || []).forEach((item) => {
            merged.push({ ...item, sentiment });
          });
        });

        // Deduplicate — keep highest count per word
        const seen = new Map();
        merged.forEach((item) => {
          if (!seen.has(item.word) || seen.get(item.word).count < item.count) {
            seen.set(item.word, item);
          }
        });

        // Sort by count then shuffle slightly for organic feel
        const sorted = [...seen.values()].sort((a, b) => b.count - a.count);
        const shuffled = sorted
          .map((item, i) => ({ item, sort: i + (Math.random() - 0.5) * 3 }))
          .sort((a, b) => a.sort - b.sort)
          .map((x) => x.item);

        setWords(shuffled);
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <Section title="سحابة الكلمات"><Spinner /></Section>;
  if (error)   return <Section title="سحابة الكلمات"><ErrorBox message={error} /></Section>;
  if (words.length === 0) return (
    <Section title="سحابة الكلمات">
      <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات</p>
    </Section>
  );

  const maxCount = Math.max(...words.map((w) => w.count));
  const minCount = Math.min(...words.map((w) => w.count));

  const getSize = (count) => {
    if (maxCount === minCount) return 28;
    const ratio = (count - minCount) / (maxCount - minCount);
    return Math.round(13 + ratio * 39);
  };

  const getOpacity = (count) => {
    if (maxCount === minCount) return 0.9;
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.45 + ratio * 0.55;
  };

  const SENTIMENT_GLOW = {
    positive: "rgba(52,211,153,0.35)",
    neutral:  "rgba(148,163,184,0.25)",
    negative: "rgba(248,113,113,0.35)",
  };

  return (
    <Section title="سحابة الكلمات">
      {/* Legend */}
      <div className="flex gap-4 justify-end text-xs">
        {["positive", "neutral", "negative"].map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SENTIMENT_COLORS[s] }}
            />
            <span style={{ color: SENTIMENT_COLORS[s] }}>
              {SENTIMENT_LABELS[s]}
            </span>
          </span>
        ))}
      </div>

      {/* Cloud */}
      <div
        className="flex flex-wrap gap-x-4 gap-y-3 justify-center items-center
                   rounded-2xl bg-slate-950/60 border border-slate-800/60
                   px-6 py-8 min-h-48"
        dir="rtl"
      >
        {words.map((word, i) => {
          const size    = getSize(word.count);
          const opacity = getOpacity(word.count);
          const color   = SENTIMENT_COLORS[word.sentiment];
          const glow    = SENTIMENT_GLOW[word.sentiment];

          return (
            <motion.span
              key={`${word.word}-${word.sentiment}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity, scale: 1 }}
              transition={{ delay: i * 0.018, duration: 0.35, ease: "easeOut" }}
              whileHover={{ opacity: 1, scale: 1.18, transition: { duration: 0.15 } }}
              title={`${word.word} — ${SENTIMENT_LABELS[word.sentiment]} (${word.count})`}
              className="cursor-default select-none leading-tight font-medium"
              style={{
                fontSize:   `${size}px`,
                color,
                textShadow: `0 0 18px ${glow}`,
                fontFamily: "'Segoe UI', Tahoma, sans-serif",
              }}
            >
              {word.word}
            </motion.span>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 text-center">
        حجم الكلمة يعكس تكرارها — مرّر فوقها لرؤية التفاصيل
      </p>
    </Section>
  );
}

// ─── Post Feed ────────────────────────────────────────────────────────────────

const SENTIMENT_FILTERS = [
  { value: "",         label: "الكل"   },
  { value: "positive", label: "إيجابي" },
  { value: "neutral",  label: "محايد"  },
  { value: "negative", label: "سلبي"   },
];

function SentimentPostCard({ post }) {
  const date = new Date(post.created_at).toLocaleDateString("ar-DZ", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });

  const scorePercent =
    post.sentiment_score != null
      ? Math.round(post.sentiment_score * 100)
      : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <SentimentBadge sentiment={post.sentiment} />
          {scorePercent !== null && (
            <span className="text-xs text-slate-500">{scorePercent}% ثقة</span>
          )}
          <SourceBadge source={post.source} />
        </div>
        <span className="text-xs text-slate-500 shrink-0">{date}</span>
      </div>

      <p
        className="text-sm text-slate-200 leading-relaxed line-clamp-3 text-right"
        dir="auto"
      >
        {post.text}
      </p>

      <div className="flex items-center justify-between gap-3">
        {post.author ? (
          <span className="text-xs text-slate-500">@{post.author}</span>
        ) : (
          <span />
        )}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 transition shrink-0"
          >
            عرض المصدر ↗
          </a>
        )}
      </div>
    </div>
  );
}

function PostFeed({ companyId }) {
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [sentiment,  setSentiment]  = useState("");
  const [page,       setPage]       = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext,    setHasNext]    = useState(false);
  const [hasPrev,    setHasPrev]    = useState(false);

  const PAGE_SIZE = 10;

  const fetchPosts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const res  = await api.getSentimentPosts(companyId, { page, sentiment });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "فشل التحميل");
      setPosts(data.results || []);
      setTotalCount(data.count || 0);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      setError(err.message || "فشل غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [companyId, page, sentiment]);

  useEffect(() => { setPage(1); }, [sentiment, companyId]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Section title="المنشورات حسب المشاعر">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap justify-end">
        {SENTIMENT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSentiment(f.value)}
            className={`rounded-lg px-3 py-1 text-xs font-medium border transition ${
              sentiment === f.value && !f.value
                ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                : sentiment !== f.value
                ? "text-slate-400 border-slate-700 hover:text-slate-200"
                : "border-current"
            }`}
            style={
              sentiment === f.value && f.value
                ? {
                    color:           SENTIMENT_COLORS[f.value],
                    backgroundColor: `${SENTIMENT_COLORS[f.value]}18`,
                    borderColor:     `${SENTIMENT_COLORS[f.value]}40`,
                  }
                : {}
            }
          >
            {f.label}
          </button>
        ))}
        {totalCount > 0 && (
          <span className="text-xs text-slate-500 self-center mr-2">
            {totalCount.toLocaleString("ar-DZ")} منشور
          </span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
          <p className="text-slate-400">لا توجد منشورات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <SentimentPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            السابق ←
          </button>
          <span className="text-sm text-slate-500">
            صفحة {page} من {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            التالي →
          </button>
        </div>
      )}
    </Section>
  );
}

// ─── Keyword Breakdown ────────────────────────────────────────────────────────

const KEYWORD_TABS = [
  { key: "positive", label: "إيجابي" },
  { key: "neutral",  label: "محايد"  },
  { key: "negative", label: "سلبي"   },
];

function KeywordBreakdown({ companyId }) {
  const [keywords,  setKeywords]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("positive");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .getSentimentKeywords(companyId, 10)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setKeywords(json.keywords || {});
      })
      .catch((err) => setError(err.message || "فشل التحميل"))
      .finally(() => setLoading(false));
  }, [companyId]);

  const list     = keywords?.[activeTab] || [];
  const maxCount = list[0]?.count || 1;

  return (
    <Section title="أبرز الكلمات حسب المشاعر">
      <div className="flex gap-2 justify-end">
        {KEYWORD_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="rounded-lg px-4 py-1.5 text-xs font-medium border transition"
            style={
              activeTab === tab.key
                ? {
                    color:           SENTIMENT_COLORS[tab.key],
                    backgroundColor: `${SENTIMENT_COLORS[tab.key]}18`,
                    borderColor:     `${SENTIMENT_COLORS[tab.key]}40`,
                  }
                : { color: "#94a3b8", borderColor: "#334155" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} />
      ) : list.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">لا توجد بيانات</p>
      ) : (
        <div className="space-y-2.5">
          {list.map((item, i) => (
            <div key={item.word} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-4 shrink-0 text-left">
                {i + 1}
              </span>
              <div className="flex-1 rounded-full bg-slate-800 h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width:           `${Math.round((item.count / maxCount) * 100)}%`,
                    backgroundColor: SENTIMENT_COLORS[activeTab],
                    opacity:         0.75,
                  }}
                />
              </div>
              <span
                className="text-sm font-medium w-40 text-right shrink-0"
                dir="auto"
                style={{ color: SENTIMENT_COLORS[activeTab] }}
              >
                {item.word}
              </span>
              <span className="text-xs text-slate-500 shrink-0 w-12 text-right">
                {item.count.toLocaleString("ar-DZ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SentimentPage() {
  const navigate      = useNavigate();
  const { activeCompany } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-2 text-sm text-slate-400 hover:text-sky-400 transition"
            >
              → لوحة التحكم
            </button>
            <h1 className="text-3xl font-bold">تحليل المشاعر</h1>
            {activeCompany && (
              <p className="mt-1 text-sm text-sky-400">{activeCompany.name}</p>
            )}
          </div>
        </div>

        {!activeCompany ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <p className="text-slate-400">لم يتم تحديد شركة</p>
          </div>
        ) : (
          <>
            {/* Row 1: Pie + Timeline+Stats side by side on large screens */}
            <div className="grid gap-6 xl:grid-cols-2">
              <SentimentPieChart companyId={activeCompany.id} />
              <SentimentTimeline companyId={activeCompany.id} />
            </div>

            {/* Row 2: Word Cloud */}
            <WordCloud companyId={activeCompany.id} />

            {/* Row 3: Post Feed */}
            <PostFeed companyId={activeCompany.id} />

            {/* Row 4: Keyword Breakdown */}
            <KeywordBreakdown companyId={activeCompany.id} />
          </>
        )}

      </div>
    </div>
  );
}