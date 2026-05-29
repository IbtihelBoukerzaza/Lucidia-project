import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
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

/* ── Hidden print-ready div rendered by browser (handles Arabic + RTL perfectly) ── */
function PrintableReport({ report, companyName }) {
  if (!report) return null;
  const lines = report.content.split("\n");
  return (
    <div style={{
      width: "794px",         /* A4 width at 96dpi */
      padding: "48px 56px",
      background: "#FFFFFF",
      color: "#111111",
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      direction: "rtl",
      textAlign: "right",
      boxSizing: "border-box",
    }}>
      {/* Header bar */}
      <div style={{
        background: "#C9A84C",
        margin: "-48px -56px 36px -56px",
        padding: "16px 56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontWeight: "700", fontSize: "16px", color: "#000" }}>Gantra AI</span>
        <span style={{ fontSize: "12px", color: "#000" }}>
          {companyName} · {formatDateTime(report.generated_at)} · {report.period_days} يوم
        </span>
      </div>

      {/* Content */}
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} style={{ fontSize: "20px", fontWeight: "700", color: "#C9A84C", marginBottom: "12px", marginTop: "8px" }}>
              {line.replace("# ", "")}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} style={{
              fontSize: "15px", fontWeight: "700", color: "#B8892A",
              marginTop: "24px", marginBottom: "8px",
              borderBottom: "1px solid #C9A84C66", paddingBottom: "6px",
            }}>
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", lineHeight: "1.8", fontSize: "13px" }}>
              <span style={{ color: "#C9A84C" }}>•</span>
              <span>{line.replace("- ", "")}</span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} style={{ height: "10px" }} />;
        return (
          <p key={i} style={{ marginBottom: "6px", lineHeight: "1.9", fontSize: "13px" }}>
            {line}
          </p>
        );
      })}

      {/* Footer */}
      <div style={{
        marginTop: "48px", paddingTop: "12px",
        borderTop: "1px solid #E5E7EB",
        display: "flex", justifyContent: "space-between",
        fontSize: "11px", color: "#9CA3AF",
      }}>
        <span>Gantra — منصة تحليل المشاعر</span>
        <span>تقرير #{report.id}</span>
      </div>
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

  const [latest,      setLatest]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState("");
  const [periodDays,  setPeriodDays]  = useState(30);

  /* ref to the hidden printable div */
  const printRef = useRef(null);

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
      const res  = await api.generateInsight(company.id, periodDays, lang);
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

  /* ── NEW: screenshot the hidden div → PDF ── */
  async function handleDownloadPDF() {
    if (!printRef.current || !selected) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,           /* 2× for sharp text */
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData  = canvas.toDataURL("image/png");
      const pdf      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();

      /* canvas dimensions in mm (at 96dpi: 1px = 0.2646mm) */
      const pxToMm   = 0.2646;
      const imgW     = canvas.width  * pxToMm;
      const imgH     = canvas.height * pxToMm;

      /* scale to fit page width */
      const ratio    = pageW / imgW;
      const scaledH  = imgH * ratio;

      /* if content fits on one page */
      if (scaledH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pageW, scaledH);
      } else {
        /* multi-page: slice the canvas vertically */
        let yOffset = 0;
        const sliceH = Math.floor(pageH / ratio); /* height in px per page */

        while (yOffset < canvas.height) {
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width  = canvas.width;
          sliceCanvas.height = Math.min(sliceH, canvas.height - yOffset);

          const ctx = sliceCanvas.getContext("2d");
          ctx.drawImage(canvas, 0, -yOffset);

          const sliceData = sliceCanvas.toDataURL("image/png");
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(sliceData, "PNG", 0, 0, pageW, sliceCanvas.height * ratio * pxToMm);

          yOffset += sliceH;
        }
      }

      pdf.save(`gantra-report-${company.name}-${selected.id}.pdf`);
    } catch (err) {
      setError("فشل تحميل PDF. حاول مجدداً.");
      console.error(err);
    } finally {
      setDownloading(false);
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

      {/* ── Hidden printable div (off-screen, not display:none so html2canvas can read it) ── */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", zIndex: -1 }}>
        <div ref={printRef}>
          <PrintableReport report={selected} companyName={company.name} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .insights-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

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
            <option value={7}>{t("insights.period7",  "آخر 7 أيام")}</option>
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
        <div className={history.length > 1 ? "insights-grid" : ""}>

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
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    style={{
                      display: "flex", alignItems: "center", gap: "7px",
                      padding: "7px 16px", borderRadius: "8px",
                      border: "1px solid #C9A84C44",
                      background: "#C9A84C11",
                      color: downloading ? ui.muted : "#C9A84C",
                      fontSize: "13px", fontWeight: "600",
                      cursor: downloading ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = "#C9A84C22"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#C9A84C11"; }}
                  >
                    {downloading ? (
                      <>
                        <span style={{
                          display: "inline-block", width: "12px", height: "12px",
                          border: "2px solid #9CA3AF", borderTopColor: "transparent",
                          borderRadius: "50%", animation: "spin 0.8s linear infinite",
                        }} />
                        {t("insights.downloading", "جارٍ التحميل...")}
                      </>
                    ) : (
                      <>⬇ {t("insights.download", "تحميل PDF")}</>
                    )}
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