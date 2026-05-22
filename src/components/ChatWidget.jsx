import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { MessageSquare, X, Send, Bot, User, Trash2 } from "lucide-react";

export default function ChatWidget() {
  const { t, i18n }       = useTranslation();
  const { theme }         = useTheme();
  const { activeCompany, isAuthenticated } = useAuth();
  const isDark            = theme === "dark";

  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [history, setHistory] = useState([]);   // { role, content }
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  const ui = {
    bg:      isDark ? "#111111" : "#FFFFFF",
    surface: isDark ? "#161616" : "#F8FAFC",
    border:  isDark ? "#1E1E1E" : "#E5E7EB",
    text:    isDark ? "#E5E7EB" : "#111111",
    muted:   isDark ? "#6B7280" : "#9CA3AF",
    input:   isDark ? "#0A0A0A" : "#F1F5F9",
  };

  // scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  // focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  if (!isAuthenticated || !activeCompany) return null;

  const lang = i18n.language?.slice(0, 2) || "ar";
  const isRtl = lang === "ar";

  async function handleSend() {
    const msg = input.trim();
    if (!msg || loading) return;

    const newHistory = [...history, { role: "user", content: msg }];
    setHistory(newHistory);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await api.chatMessage({
        message:    msg,
        history:    history,   // send history BEFORE this message
        company_id: activeCompany.id,
        lang,
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "فشل الاتصال.");
        setHistory(prev => prev.slice(0, -1)); // remove optimistic user msg
        return;
      }

      const data = await res.json();
      setHistory([...newHistory, { role: "assistant", content: data.reply }]);
    } catch {
      setError("فشل الاتصال بالخادم.");
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setHistory([]);
    setError("");
  }

  const placeholders = {
    ar: "اسألني عن بيانات شركتك...",
    en: "Ask me about your company data...",
    fr: "Posez-moi une question sur vos données...",
  };

  const greetings = {
    ar: `مرحباً! أنا Gantra AI 👋\nاسألني عن مشاعر ${activeCompany.name}، الكلمات الرائجة، التنبيهات، أو أي شيء يخص بياناتك.`,
    en: `Hello! I'm Gantra AI 👋\nAsk me about ${activeCompany.name}'s sentiment, trending keywords, alerts, or anything about your data.`,
    fr: `Bonjour ! Je suis Gantra AI 👋\nPosez-moi des questions sur le sentiment de ${activeCompany.name}, les mots-clés tendance, les alertes ou vos données.`,
  };

  return (
    <>
      {/* ── FLOATING BUTTON ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Gantra AI"
        style={{
          position:       "fixed",
          bottom:         "24px",
          left:           "24px",
          zIndex:         1000,
          width:          "52px",
          height:         "52px",
          borderRadius:   "50%",
          background:     open ? "#1A1A1A" : "#C9A84C",
          border:         open ? "2px solid #C9A84C" : "none",
          color:          open ? "#C9A84C" : "#000",
          cursor:         "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          boxShadow:      "0 4px 20px rgba(201,168,76,0.4)",
          transition:     "all 0.25s",
        }}
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      {/* ── CHAT PANEL ── */}
      {open && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          style={{
            position:     "fixed",
            bottom:       "88px",
            left:         "24px",
            zIndex:       999,
            width:        "360px",
            height:       "520px",
            borderRadius: "20px",
            border:       `1px solid ${ui.border}`,
            background:   ui.bg,
            boxShadow:    isDark
              ? "0 24px 60px rgba(0,0,0,0.6)"
              : "0 24px 60px rgba(0,0,0,0.15)",
            display:      "flex",
            flexDirection:"column",
            overflow:     "hidden",
            animation:    "slideUp 0.2s ease-out",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .chat-input:focus { outline: none; }
            .chat-input::placeholder { color: ${ui.muted}; }
          `}</style>

          {/* HEADER */}
          <div style={{
            padding:        "14px 16px",
            borderBottom:   `1px solid ${ui.border}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            background:     ui.surface,
            flexShrink:     0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "10px",
                background: "#C9A84C18", border: "1px solid #C9A84C33",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#C9A84C",
              }}>
                <Bot size={16} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: ui.text }}>
                  Gantra AI
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#2E8B57" }}>
                  ● {t("chat.online", "متصل")}
                </p>
              </div>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClear}
                title={t("chat.clear", "مسح المحادثة")}
                style={{
                  background: "transparent", border: "none",
                  color: ui.muted, cursor: "pointer", padding: "4px",
                  borderRadius: "6px", display: "flex", alignItems: "center",
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* MESSAGES */}
          <div style={{
            flex:       1,
            overflowY:  "auto",
            padding:    "16px",
            display:    "flex",
            flexDirection: "column",
            gap:        "12px",
          }}>
            {/* Greeting */}
            {history.length === 0 && (
              <div style={{
                background: ui.surface,
                border:     `1px solid ${ui.border}`,
                borderRadius: "14px",
                padding:    "12px 14px",
                fontSize:   "13px",
                color:      ui.muted,
                lineHeight: "1.7",
                whiteSpace: "pre-line",
              }}>
                {greetings[lang] || greetings.ar}
              </div>
            )}

            {/* Message bubbles */}
            {history.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  style={{
                    display:        "flex",
                    justifyContent: isUser ? "flex-start" : "flex-end",
                    gap:            "8px",
                    alignItems:     "flex-end",
                  }}
                >
                  {isUser && (
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "8px",
                      background: "#4A90D918", border: "1px solid #4A90D930",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#4A90D9", flexShrink: 0,
                    }}>
                      <User size={13} />
                    </div>
                  )}
                  <div style={{
                    maxWidth:     "80%",
                    padding:      "9px 13px",
                    borderRadius: isUser ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
                    background:   isUser ? ui.surface : "#C9A84C18",
                    border:       `1px solid ${isUser ? ui.border : "#C9A84C33"}`,
                    fontSize:     "13px",
                    lineHeight:   "1.65",
                    color:        isUser ? ui.text : ui.text,
                    whiteSpace:   "pre-wrap",
                    wordBreak:    "break-word",
                  }}>
                    {msg.content}
                  </div>
                  {!isUser && (
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "8px",
                      background: "#C9A84C18", border: "1px solid #C9A84C33",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#C9A84C", flexShrink: 0,
                    }}>
                      <Bot size={13} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "flex-end" }}>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "14px 14px 4px 14px",
                  background: "#C9A84C18",
                  border: "1px solid #C9A84C33",
                  display: "flex", gap: "5px", alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#C9A84C",
                      display: "inline-block",
                      animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "8px",
                  background: "#C9A84C18", border: "1px solid #C9A84C33",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#C9A84C", flexShrink: 0,
                }}>
                  <Bot size={13} />
                </div>
              </div>
            )}

            {error && (
              <p style={{ fontSize: "12px", color: "#E53E3E", textAlign: "center", margin: 0 }}>
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div style={{
            padding:      "12px",
            borderTop:    `1px solid ${ui.border}`,
            display:      "flex",
            gap:          "8px",
            alignItems:   "flex-end",
            background:   ui.surface,
            flexShrink:   0,
          }}>
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[lang] || placeholders.ar}
              rows={1}
              style={{
                flex:        1,
                background:  ui.input,
                border:      `1px solid ${ui.border}`,
                borderRadius:"10px",
                padding:     "9px 12px",
                fontSize:    "13px",
                color:       ui.text,
                resize:      "none",
                fontFamily:  "inherit",
                lineHeight:  "1.5",
                maxHeight:   "80px",
                overflowY:   "auto",
                direction:   isRtl ? "rtl" : "ltr",
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width:          "38px",
                height:         "38px",
                borderRadius:   "10px",
                background:     !input.trim() || loading ? ui.surface : "#C9A84C",
                border:         `1px solid ${!input.trim() || loading ? ui.border : "#C9A84C"}`,
                color:          !input.trim() || loading ? ui.muted : "#000",
                cursor:         !input.trim() || loading ? "not-allowed" : "pointer",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
                transition:     "all 0.2s",
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}