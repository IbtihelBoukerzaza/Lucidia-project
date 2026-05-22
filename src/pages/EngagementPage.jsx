import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Heart, MessageCircle, Share2, Eye,
  RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  Play, Camera, Video, Radio,
} from "lucide-react";
import { api } from "../services/api";

/* ── helpers ── */
function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

/* ── platform config ── */
const P = {
  facebook:  { label: "Facebook",  color: "#4F46E5", icon: <Radio     size={13}/> },
  instagram: { label: "Instagram", color: "#EC4899", icon: <Camera   size={13}/> },
  tiktok:    { label: "TikTok",    color: "#14B8A6", icon: <Play      size={13}/> },
  youtube:   { label: "YouTube",   color: "#E53E3E", icon: <Video  size={13}/> },
};

function PBadge({ platform }) {
  const cfg = P[platform] || { label: platform, color: "#6B7280", icon: null };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 9px", borderRadius: "99px",
      background: cfg.color + "18", border: `1px solid ${cfg.color}35`,
      color: cfg.color, fontSize: "0.7rem", fontWeight: "700",
    }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function Spin({ color = "#C9A84C" }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"3rem 0" }}>
      <div style={{
        width:28, height:28,
        border:`2px solid ${color}`, borderTopColor:"transparent",
        borderRadius:"50%", animation:"spin 0.7s linear infinite",
      }}/>
    </div>
  );
}

/* ════════════════════════════════════════
   KPI STRIP
════════════════════════════════════════ */
function KpiStrip({ totals, isDark, t }) {
  const kpis = [
    { key:"post_count",    label:t("engagement.stats.posts"),    color:"#C9A84C", icon:<TrendingUp    size={16}/> },
    { key:"like_count",    label:t("engagement.stats.likes"),    color:"#E53E3E", icon:<Heart         size={16}/> },
    { key:"comment_count", label:t("engagement.stats.comments"), color:"#8B5CF6", icon:<MessageCircle size={16}/> },
    { key:"share_count",   label:t("engagement.stats.shares"),   color:"#2E8B57", icon:<Share2        size={16}/> },
    { key:"view_count",    label:t("engagement.stats.views"),    color:"#4A90D9", icon:<Eye           size={16}/> },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"10px" }}>
      {kpis.map((k, i) => (
        <motion.div key={k.key}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ delay: i*0.07 }}
          style={{
            borderRadius:"16px", padding:"1.1rem 1rem",
            border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
            background: isDark ? "#0D0D0D" : "#FAFAFA",
            position:"relative", overflow:"hidden",
          }}
        >
          <div style={{
            position:"absolute", inset:0,
            background:`radial-gradient(ellipse at top left, ${k.color}0A 0%, transparent 70%)`,
            pointerEvents:"none",
          }}/>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:32, height:32, borderRadius:"10px",
            background:`${k.color}15`, color:k.color, marginBottom:"10px",
          }}>
            {k.icon}
          </div>
          <p style={{ margin:0, fontSize:"0.68rem", color: isDark?"#6B7280":"#9CA3AF", marginBottom:"2px" }}>
            {k.label}
          </p>
          <p style={{ margin:0, fontSize:"1.5rem", fontWeight:900, color:k.color, lineHeight:1 }}>
            {fmt(totals?.[k.key])}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   PLATFORM BREAKDOWN
════════════════════════════════════════ */
function PlatformBreakdown({ breakdown, isDark, t }) {
  const rows = Object.entries(breakdown || {})
    .filter(([,v]) => v.post_count > 0)
    .map(([plat, v]) => ({
      plat,
      cfg: P[plat] || { label:plat, color:"#6B7280" },
      total: (v.like_count||0)+(v.comment_count||0)+(v.share_count||0)+(v.view_count||0),
      ...v,
    }))
    .sort((a,b) => b.total - a.total);

  const grand = rows.reduce((s,r) => s + r.total, 0);
  const pieData = rows.map(r => ({ name:r.cfg.label, value:r.total, fill:r.cfg.color }));

  const PieTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div style={{
        borderRadius:12, padding:"8px 14px",
        background: isDark?"#111":"#fff",
        border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
        fontSize:"0.78rem", color: isDark?"#E5E7EB":"#111",
      }}>
        <b style={{ color:d.payload.fill }}>{d.name}</b>
        <p style={{ margin:"2px 0 0" }}>{fmt(d.value)} · {grand>0?Math.round(d.value/grand*100):0}%</p>
      </div>
    );
  };

  return (
    <div style={{
      borderRadius:20, padding:"1.5rem",
      border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
      background: isDark?"#111":"#fff",
    }}>
      <p style={{ margin:"0 0 1.25rem", fontWeight:800, fontSize:"0.95rem", color:isDark?"#E5E7EB":"#111" }}>
        {t("engagement.platformBreakdown.title")}
      </p>

      {rows.length === 0 ? (
        <p style={{ color:"#6B7280", textAlign:"center", padding:"2rem 0", fontSize:"0.85rem" }}>
          {t("engagement.platformBreakdown.noData")}
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          <div style={{ height:180, display:"flex", justifyContent:"center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%"
                  innerRadius={48} outerRadius={78}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((e,i) => <Cell key={i} fill={e.fill} opacity={0.9}/>)}
                </Pie>
                <Tooltip content={<PieTip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {rows.map(r => {
            const pct = grand > 0 ? Math.round(r.total/grand*100) : 0;
            return (
              <div key={r.plat}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:"0.75rem", fontWeight:700, color:r.cfg.color }}>
                    {r.cfg.label}
                  </span>
                  <span style={{ fontSize:"0.72rem", color:isDark?"#6B7280":"#9CA3AF" }}>
                    {fmt(r.total)} · {pct}%
                  </span>
                </div>
                <div style={{
                  height:6, borderRadius:99,
                  background:isDark?"#1E1E1E":"#F3F4F6", overflow:"hidden",
                }}>
                  <motion.div
                    initial={{ width:0 }} animate={{ width:`${pct}%` }}
                    transition={{ duration:0.9, ease:"easeOut" }}
                    style={{ height:"100%", borderRadius:99, background:r.cfg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   TOP CONTENT
════════════════════════════════════════ */
function TopContent({ companyId, isDark, t }) {
  const [metric,  setMetric]  = useState("like_count");
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  const METRICS = [
    { v:"like_count",    label:t("engagement.metrics.likes"),    color:"#E53E3E" },
    { v:"comment_count", label:t("engagement.metrics.comments"), color:"#8B5CF6" },
    { v:"view_count",    label:t("engagement.metrics.views"),    color:"#4A90D9" },
  ];
  const active = METRICS.find(m=>m.v===metric)||METRICS[0];

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    api.getEngagementTop(companyId, metric, 10, "")
      .then(r=>r.json())
      .then(d=>setPosts(Array.isArray(d)?d:[]))
      .finally(()=>setLoading(false));
  }, [companyId, metric]);

  const barData = posts.map((p,i) => ({
    rank: i+1, value: p[metric]??0,
    platform: p.platform, title: p.title||p.url, url: p.url,
  }));

  const BarTip = ({ active: a, payload }) => {
    if (!a||!payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        borderRadius:12, padding:"8px 14px",
        background:isDark?"#111":"#fff",
        border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
        fontSize:"0.78rem", maxWidth:220,
      }}>
        <p style={{ color:P[d.platform]?.color||"#C9A84C", fontWeight:700, margin:"0 0 2px" }}>
          {fmt(d.value)} {active.label}
        </p>
        <p style={{ color:isDark?"#9CA3AF":"#6B7280", margin:0, fontSize:"0.7rem",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {d.title}
        </p>
      </div>
    );
  };

  return (
    <div style={{
      borderRadius:20, padding:"1.5rem",
      border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
      background:isDark?"#111":"#fff",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap", gap:8 }}>
        <p style={{ margin:0, fontWeight:800, fontSize:"0.95rem", color:isDark?"#E5E7EB":"#111" }}>
          {t("engagement.topPosts.title")}
        </p>
        <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}` }}>
          {METRICS.map(m => (
            <button key={m.v} onClick={()=>setMetric(m.v)} style={{
              padding:"5px 12px", fontSize:"0.72rem", fontWeight:700,
              border:"none", cursor:"pointer",
              background: metric===m.v ? m.color : "transparent",
              color: metric===m.v?"#fff": isDark?"#6B7280":"#9CA3AF",
              transition:"all 0.2s",
            }}>{m.label}</button>
          ))}
        </div>
      </div>

      {loading ? <Spin color={active.color}/> : barData.length===0 ? (
        <p style={{ color:"#6B7280", textAlign:"center", padding:"2rem 0", fontSize:"0.85rem" }}>
          {t("engagement.topPosts.noData")}
        </p>
      ) : (
        <div style={{ height:280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" barSize={10}
              margin={{ left:0, right:20, top:0, bottom:0 }}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="rank" width={24}
                tick={{ fill:isDark?"#4B5563":"#9CA3AF", fontSize:11, fontWeight:700 }}
                axisLine={false} tickLine={false}
                tickFormatter={v=>`#${v}`}/>
              <Tooltip content={<BarTip/>} cursor={{ fill:isDark?"#1E1E1E30":"#F3F4F630" }}/>
              <Bar dataKey="value" radius={[0,6,6,0]}>
                {barData.map((e,i) => (
                  <Cell key={i} fill={P[e.platform]?.color||active.color} opacity={1-i*0.06}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   POSTS TABLE
════════════════════════════════════════ */
function PostsTable({ companyId, isDark, t }) {
  const [posts,    setPosts]    = useState([]);
  const [platform, setPlatform] = useState("");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true); setError("");
    try {
      const r = await api.getEngagement(companyId, platform, page);
      const d = await r.json();
      setPosts(d.results||[]);
      setTotal(d.num_pages||1);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyId, platform, page]);

  useEffect(()=>{ setPage(1); }, [platform, companyId]);
  useEffect(()=>{ load(); }, [load]);

  const platforms = [
    { v:"",          label:t("engagement.table.allPlatforms") },
    { v:"facebook",  label:"Facebook" },
    { v:"instagram", label:"Instagram" },
    { v:"tiktok",    label:"TikTok" },
    { v:"youtube",   label:"YouTube" },
  ];

  return (
    <div style={{
      borderRadius:20, padding:"1.5rem",
      border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
      background:isDark?"#111":"#fff",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap", gap:8 }}>
        <p style={{ margin:0, fontWeight:800, fontSize:"0.95rem", color:isDark?"#E5E7EB":"#111" }}>
          {t("engagement.table.title")}
        </p>
        <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}` }}>
          {platforms.map(opt => (
            <button key={opt.v} onClick={()=>setPlatform(opt.v)} style={{
              padding:"5px 11px", fontSize:"0.72rem", fontWeight:700,
              border:"none", cursor:"pointer",
              background: platform===opt.v
                ? (opt.v ? P[opt.v]?.color||"#C9A84C" : "#C9A84C")
                : "transparent",
              color: platform===opt.v?"#fff": isDark?"#6B7280":"#9CA3AF",
              transition:"all 0.2s",
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {loading ? <Spin/> : error ? (
        <p style={{ color:"#E53E3E", fontSize:"0.82rem", textAlign:"center" }}>{error}</p>
      ) : posts.length===0 ? (
        <p style={{ color:"#6B7280", textAlign:"center", padding:"2rem 0", fontSize:"0.85rem" }}>
          {t("engagement.table.noData")}
        </p>
      ) : (
        <>
          <div style={{ overflowX:"auto", borderRadius:12, border:`1px solid ${isDark?"#1E1E1E":"#F3F4F6"}` }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
              <thead>
                <tr style={{ background:isDark?"#0D0D0D":"#FAFAFA" }}>
                  {[
                    { label:t("engagement.table.platform"), align:"right" },
                    { label:t("engagement.table.link"),     align:"right" },
                    { label:<Heart size={12}/>,              align:"center" },
                    { label:<MessageCircle size={12}/>,      align:"center" },
                    { label:<Share2 size={12}/>,             align:"center" },
                    { label:<Eye size={12}/>,                align:"center" },
                    { label:t("engagement.table.date"),      align:"center" },
                  ].map((col,i) => (
                    <th key={i} style={{
                      padding:"10px 12px", textAlign:col.align,
                      fontSize:"0.68rem", fontWeight:700,
                      color:isDark?"#4B5563":"#9CA3AF",
                      borderBottom:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
                      whiteSpace:"nowrap",
                    }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {posts.map((p,i) => (
                    <motion.tr key={p.id}
                      initial={{ opacity:0 }} animate={{ opacity:1 }}
                      transition={{ delay:i*0.03 }}
                      style={{ borderBottom:`1px solid ${isDark?"#1A1A1A":"#F3F4F6"}` }}
                      onMouseEnter={e=>e.currentTarget.style.background=isDark?"#161616":"#F9FAFB"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      <td style={{ padding:"10px 12px", textAlign:"right" }}>
                        <PBadge platform={p.platform}/>
                      </td>
                      <td style={{ padding:"10px 12px", maxWidth:200 }}>
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          title={p.title||p.url}
                          style={{
                            display:"flex", alignItems:"center", gap:4,
                            color:"#C9A84C", textDecoration:"none", fontWeight:600,
                            fontSize:"0.78rem", whiteSpace:"nowrap",
                            overflow:"hidden", textOverflow:"ellipsis",
                          }}>
                          <ExternalLink size={10} style={{ flexShrink:0 }}/>
                          {p.title || t("engagement.table.viewPost")}
                        </a>
                      </td>
                      {[p.like_count, p.comment_count, p.share_count, p.view_count].map((v,j) => (
                        <td key={j} style={{
                          padding:"10px 12px", textAlign:"center",
                          fontWeight:600, color:isDark?"#E5E7EB":"#111",
                        }}>{fmt(v)}</td>
                      ))}
                      <td style={{
                        padding:"10px 12px", textAlign:"center",
                        fontSize:"0.7rem", color:isDark?"#6B7280":"#9CA3AF",
                      }}>{fmtDate(p.scraped_at)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {total > 1 && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"1rem" }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{
                  display:"inline-flex", alignItems:"center", gap:4,
                  padding:"6px 14px", borderRadius:10, fontSize:"0.78rem",
                  border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
                  background:"transparent", color:isDark?"#E5E7EB":"#111",
                  cursor:page===1?"not-allowed":"pointer", opacity:page===1?0.4:1,
                }}>
                <ChevronRight size={14}/> {t("engagement.table.prev")}
              </button>
              <span style={{ fontSize:"0.78rem", color:"#6B7280" }}>{page} / {total}</span>
              <button onClick={()=>setPage(p=>Math.min(total,p+1))} disabled={page===total}
                style={{
                  display:"inline-flex", alignItems:"center", gap:4,
                  padding:"6px 14px", borderRadius:10, fontSize:"0.78rem",
                  border:`1px solid ${isDark?"#1E1E1E":"#E5E7EB"}`,
                  background:"transparent", color:isDark?"#E5E7EB":"#111",
                  cursor:page===total?"not-allowed":"pointer", opacity:page===total?0.4:1,
                }}>
                {t("engagement.table.next")} <ChevronLeft size={14}/>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function EngagementPage() {
  const { activeCompany } = useAuth();
  const { theme }         = useTheme();
  const { t }             = useTranslation();
  const isDark            = theme === "dark";

  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [scraping,  setScraping]  = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");
  const [scrapeErr, setScrapeErr] = useState("");

  const isAdmin = activeCompany?.role === "admin";

  const loadStats = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true); setError("");
    try {
      const r = await api.getEngagementStats(activeCompany.id);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setStats(d);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [activeCompany]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleScrape = async () => {
    if (!activeCompany || scraping) return;
    setScraping(true); setScrapeMsg(""); setScrapeErr("");
    try {
      const res  = await api.triggerEngagementScrape(activeCompany.id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("engagement.scrape.error"));
      const s     = data.summary?.scraped || {};
      const total = Object.values(s).reduce((a,b)=>a+b, 0);
      setScrapeMsg(`${t("engagement.scrape.success")} — ${total} ${t("engagement.scrape.posts")}`);
      await loadStats();
    } catch(e) { setScrapeErr(e.message || t("engagement.scrape.error")); }
    finally { setScraping(false); }
  };

  const ui = {
    bg:     isDark ? "#0A0A0A" : "#F4F4F0",
    text:   isDark ? "#E5E7EB" : "#111111",
    muted:  isDark ? "#6B7280" : "#9CA3AF",
    border: isDark ? "#1E1E1E" : "#E5E7EB",
  };

  return (
    <div dir="rtl" style={{ minHeight:"100vh", background:ui.bg, color:ui.text }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      <div style={{ maxWidth:1080, margin:"0 auto", padding:"2rem 1.25rem" }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{
                margin:"0 0 4px", fontSize:"0.7rem", fontWeight:700,
                color:"#C9A84C", letterSpacing:"0.1em", textTransform:"uppercase",
              }}>
                {t("engagement.badge")}
              </p>
              <h1 style={{ margin:"0 0 4px", fontSize:"1.65rem", fontWeight:900 }}>
                {t("engagement.title")}
              </h1>
              <p style={{ margin:0, fontSize:"0.82rem", color:ui.muted }}>
                {activeCompany?.name}
              </p>
            </div>

            {isAdmin && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <button onClick={handleScrape} disabled={scraping} style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  padding:"9px 20px", borderRadius:12, fontSize:"0.82rem", fontWeight:700,
                  border:"none", cursor:scraping?"not-allowed":"pointer",
                  background: scraping ? "#C9A84C55" : "#C9A84C",
                  color:"#000", transition:"all 0.2s",
                }}>
                  <RefreshCw size={14} style={{ animation:scraping?"spin 1s linear infinite":"none" }}/>
                  {scraping ? t("engagement.scrape.loading") : t("engagement.scrape.button")}
                </button>
                {scrapeMsg && <p style={{ margin:0, fontSize:"0.73rem", color:"#2E8B57", fontWeight:600 }}>✓ {scrapeMsg}</p>}
                {scrapeErr && <p style={{ margin:0, fontSize:"0.73rem", color:"#E53E3E", fontWeight:600 }}>✗ {scrapeErr}</p>}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── BODY ── */}
        {!activeCompany ? (
          <p style={{ textAlign:"center", color:ui.muted, padding:"4rem 0" }}>
            {t("engagement.errors.noCompany")}
          </p>
        ) : loading ? <Spin color="#C9A84C"/> : error ? (
          <p style={{ color:"#E53E3E", textAlign:"center", padding:"2rem 0" }}>{error}</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            <KpiStrip totals={stats?.totals} isDark={isDark} t={t}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:"1.25rem" }}>
              <TopContent companyId={activeCompany.id} isDark={isDark} t={t}/>
              <PlatformBreakdown breakdown={stats?.breakdown} isDark={isDark} t={t}/>
            </div>
            <PostsTable companyId={activeCompany.id} isDark={isDark} t={t}/>
          </div>
        )}
      </div>
    </div>
  );
}