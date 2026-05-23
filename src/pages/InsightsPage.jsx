import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function handlePrint(report, companyName) {
  const printWindow = window.open("", "_blank");

  const lines = report.content.split("\n");
  let html = "";

  for (const line of lines) {
    if (line.startsWith("# ")) {
      html += `<h1>${line.replace("# ", "")}</h1>`;
    } else if (line.startsWith("## ")) {
      html += `<h2>${line.replace("## ", "")}</h2>`;
    } else if (line.startsWith("- ")) {
      html += `<li>${line.replace("- ", "")}</li>`;
    } else if (line.trim() === "") {
      html += `<br/>`;
    } else {
      html += `<p>${line}</p>`;
    }
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>Gantra — ${companyName} — ${formatDateTime(report.generated_at)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.9;
          color: #111;
          background: #fff;
          padding: 48px 56px;
          direction: rtl;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #C9A84C;
          padding-bottom: 16px;
          margin-bottom: 32px;
        }
        .brand {
          font-size: 22px;
          font-weight: 900;
          color: #C9A84C;
          letter-spacing: -0.5px;
        }
        .meta {
          font-size: 12px;
          color: #9CA3AF;
          text-align: left;
        }
        h1 {
          font-size: 20px;
          font-weight: 800;
          color: #C9A84C;
          margin: 0 0 16px;
        }
        h2 {
          font-size: 15px;
          font-weight: 700;
          color: #B8912E;
          margin: 28px 0 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #C9A84C33;
        }
        p {
          margin-bottom: 8px;
          color: #222;
        }
        li {
          margin: 6px 0 6px 0;
          padding-right: 16px;
          color: #222;
          list-style: none;
          position: relative;
        }
        li::before {
          content: "•";
          color: #C9A84C;
          position: absolute;
          right: 0;
        }
        .footer {
          margin-top: 48px;
          padding-top: 16px;
          border-top: 1px solid #E5E7EB;
          font-size: 11px;
          color: #9CA3AF;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { padding: 32px 40px; }
          h2 { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">✦ Gantra AI</div>
        <div class="meta">
          <div>${companyName}</div>
          <div>${formatDateTime(report.generated_at)}</div>
          <div>${report.period_days} يوم / jours / days</div>
        </div>
      </div>
      ${html}
      <div class="footer">
        <span>Gantra — منصة تحليل المشاعر</span>
        <span>gantra.dz</span>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}

function MarkdownReport({ content, ui }) {
  const lines = content.split("\n");

  return (
    <div style={{ lineHeight: "2", fontSize: "15px", color: ui.text }}>
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} style={{ fontSize: "22px", fontWeight: "700", color: "#C9A84C", marginBottom: "12px", marginTop: "8px" }}>
              {line.replace("# ", "")}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} style={{ fontSize: "17px", fontWeight: "700", color: "#C9A84C", marginTop: "24px", marginBottom: "8px", borderBottom: `1px solid #C9A84C44`, paddingBottom: "6px" }}>
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", paddingRight: "8px" }}>
              <span style={{ color: "#C9A84C", marginTop: "2px" }}>•</span>
              <span>{line.replace("- ", "")}</span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} style={{ height: "8px" }} />;
        return <p key={i} style={{ marginBottom: "6px" }}>{line}</p>;
      })}
    </div>
  );
}

export default function InsightsPage() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { companies } = useAuth();
  const isDark = theme === "dark";

  const ui = {
    bg:       isDark ? "#0A0A0A" : "#F7F6F2",
    panel:    isDark ? "#111111" : "#FFFFFF",
    border:   isDark ? "#1E1E1E" : "#E5E7EB",
    muted:    isDark ? "#6B7280" : "#9CA3AF",
    text:     isDark ? "#E5E7EB" : "#111111",
    surface2: isDark ? "#161616" : "#F8FAFC",
  };

  const company = companies?.[0];

  const [latest, setLatest]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState("");
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    if (!company) return;
    fetchData();
  }, [company]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [latestRes, historyRes] = await Promise.all([
        api.getLatestInsight(company.id),
        api.getInsightHistory(company.id),
      ]);

      if (latestRes.ok) {
        const data = await latestRes.json();
        setLatest(data);
        setSelected(data);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data);
      }
    } catch {
      setError(t("insights.fetchError", "تعذّر تحميل التقارير."));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const lang = i18n.language?.slice(0, 2) || "ar";
      const res = await api.generateInsight(company.id, periodDays, lang);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || t("insights.generateError", "فشل إنشاء التقرير."));
        return;
      }
      const data = await res.json();
      setLatest(data);
      setSelected(data);
      setHistory(prev => [data, ...prev]);
    } catch {
      setError(t("insights.generateError", "فشل إنشاء التقرير."));
    } finally {
      setGenerating(false);
    }
  }

  if (!company) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: ui.muted }}>{t("insights.noCompany", "لا توجد شركة مرتبطة بحسابك.")}</p>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: ui.bg, color: ui.text, padding: "32px 24px" }}>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#C9A84C", marginBottom: "4px" }}>
            ✨ {t("insights.title", "التقارير الذكية")}
          </h1>
          <p style={{ color: ui.muted, fontSize: "14px" }}>
            {t("insights.subtitle", "تقارير تحليل المشاعر المولّدة بالذكاء الاصطناعي")} — {company.name}
          </p>
        </div>

        {/* Generate controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <select
            value={periodDays}
            onChange={e => setPeriodDays(Number(e.target.value))}
            style={{
              background: ui.surface2, border: `1px solid ${ui.border}`,
              color: ui.text, borderRadius: "8px", padding: "8px 12px",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            <option value={7}>{t("insights.period7", "آخر 7 أيام")}</option>
            <option value={30}>{t("insights.period30", "آخر 30 يوماً")}</option>
            <option value={90}>{t("insights.period90", "آخر 90 يوماً")}</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: generating ? ui.surface2 : "#C9A84C",
              color: generating ? ui.muted : "#000",
              border: "none", borderRadius: "8px",
              padding: "9px 20px", fontWeight: "700",
              fontSize: "14px", cursor: generating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "background 0.2s",
            }}
          >
            {generating ? (
              <>
                <span style={{
                  display: "inline-block", width: "14px", height: "14px",
                  border: "2px solid #9CA3AF", borderTopColor: "transparent",
                  borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />
                {t("insights.generating", "جارٍ الإنشاء...")}
              </>
            ) : (
              <>✨ {t("insights.generate", "إنشاء تقرير جديد")}</>
            )}
          </button>
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          background: "#E53E3E22", border: "1px solid #E53E3E55",
          borderRadius: "8px", padding: "12px 16px",
          color: "#E53E3E", marginBottom: "24px", fontSize: "14px",
        }}>
          {error}
        </div>
      )}

      {/* ── LOADING ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <div style={{
            width: "36px", height: "36px",
            border: "3px solid #C9A84C33", borderTopColor: "#C9A84C",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: history.length > 1 ? "260px 1fr" : "1fr",
          gap: "24px",
          alignItems: "start",
        }}>

          {/* ── HISTORY SIDEBAR ── */}
          {history.length > 1 && (
            <div style={{
              background: ui.panel, border: `1px solid ${ui.border}`,
              borderRadius: "12px", overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 16px", borderBottom: `1px solid ${ui.border}`,
                fontSize: "13px", fontWeight: "700", color: ui.muted,
              }}>
                {t("insights.history", "السجل")}
              </div>
              {history.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{
                    padding: "12px 16px", cursor: "pointer", fontSize: "13px",
                    background: selected?.id === r.id ? "#C9A84C18" : "transparent",
                    borderBottom: `1px solid ${ui.border}`,
                    borderRight: selected?.id === r.id ? "3px solid #C9A84C" : "3px solid transparent",
                    color: selected?.id === r.id ? "#C9A84C" : ui.text,
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ fontWeight: "600", marginBottom: "3px" }}>
                    {t("insights.reportLabel", "تقرير")} #{r.id}
                  </div>
                  <div style={{ color: ui.muted, fontSize: "12px" }}>{formatDateTime(r.generated_at)}</div>
                  <div style={{ color: ui.muted, fontSize: "12px" }}>{r.period_days} {t("insights.days", "يوم")}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── REPORT PANEL ── */}
          <div style={{
            background: ui.panel, border: `1px solid ${ui.border}`,
            borderRadius: "12px", padding: "28px 32px",
          }}>
            {selected ? (
              <>
                {/* Report meta + download button */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: "24px",
                  flexWrap: "wrap", gap: "12px",
                }}>
                  <div style={{ fontSize: "13px", color: ui.muted }}>
                    🕐 {formatDateTime(selected.generated_at)} &nbsp;·&nbsp;
                    📅 {selected.period_days} {t("insights.days", "يوم")}
                  </div>

                  <button
                    onClick={() => handlePrint(selected, company.name)}
                    style={{
                      display: "flex", alignItems: "center", gap: "7px",
                      padding: "7px 16px", borderRadius: "8px",
                      border: "1px solid #C9A84C44",
                      background: "#C9A84C11",
                      color: "#C9A84C",
                      fontSize: "13px", fontWeight: "600",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#C9A84C22"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#C9A84C11"; }}
                  >
                    ⬇ {t("insights.download", "تحميل PDF")}
                  </button>
                </div>

                <MarkdownReport content={selected.content} ui={ui} />
              </>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                height: "300px", gap: "16px",
              }}>
                <div style={{ fontSize: "48px" }}>✨</div>
                <p style={{ color: ui.muted, fontSize: "15px", textAlign: "center" }}>
                  {t("insights.empty", "لا توجد تقارير بعد. اضغط على «إنشاء تقرير جديد» للبدء.")}
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}