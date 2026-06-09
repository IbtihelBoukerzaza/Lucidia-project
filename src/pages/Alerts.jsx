import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, Hash, Bell, BarChart2, Globe, Shield,
  ChevronDown, Menu, X, ArrowLeft, Check, Zap,
  ThumbsDown, TrendingDown, AlertTriangle, Target,
  RefreshCw, Filter, Clock,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo.png'

// ─── Simulation data ──────────────────────────────────────────────────────────

const RULES = [
  { id: 1, type: 'negative_pct',   label: 'نسبة السلبي > 40%',              threshold: 40,  unit: '%',      color: '#E53E3E', baseValue: 28,  amplitude: 18,  severity: 'high'   },
  { id: 2, type: 'volume_spike',   label: 'حجم منشورات > 300',              threshold: 300, unit: 'منشور',  color: '#F59E0B', baseValue: 210, amplitude: 120, severity: 'medium' },
  { id: 3, type: 'sentiment_drop', label: 'انخفاض الإيجابي > 20 نقطة',     threshold: 20,  unit: 'نقطة',   color: '#8B5CF6', baseValue: 10,  amplitude: 16,  severity: 'high'   },
  { id: 4, type: 'keyword_spike',  label: 'كلمة «مشكلة» > 50 مرة',         threshold: 50,  unit: 'مرة',    color: '#4A90D9', baseValue: 28,  amplitude: 32,  severity: 'medium' },
]

const SEVERITY_CFG = {
  high:   { label: 'عالٍ',   color: '#E53E3E', bg: '#E53E3E15', border: '#E53E3E35' },
  medium: { label: 'متوسط', color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B35' },
  low:    { label: 'منخفض', color: '#2E8B57', bg: '#2E8B5715', border: '#2E8B5735' },
}

const FIRED_TEMPLATES = [
  (rule, val) => `نسبة المشاعر السلبية بلغت ${val}% وتجاوزت الحد ${rule.threshold}%`,
  (rule, val) => `حجم المنشورات اليومية تجاوز الحد ${rule.threshold} منشور — القيمة الحالية: ${val}`,
  (rule, val) => `انخفض مؤشر الإيجابي بـ ${val} نقطة وتجاوز الحد ${rule.threshold}`,
  (rule, val) => `الكلمة المفتاحية ظهرت ${val} مرة وتجاوزت الحد ${rule.threshold}`,
]

// ─── Alerts Simulation ────────────────────────────────────────────────────────

function AlertsSimulation({ isDark }) {
  const [values, setValues] = useState(() => RULES.map(r => r.baseValue))
  const [fired,  setFired]  = useState([])
  const [nextIn, setNextIn] = useState(15)
  const countdownRef = useRef(15)

  // interval 1 — animate gauge values
  useEffect(() => {
    const id = setInterval(() => {
      setValues(prev =>
        prev.map((v, i) => {
          const r     = RULES[i]
          const noise = (Math.random() - 0.45) * (r.amplitude * 0.35)
          return Math.max(0, Math.min(r.threshold * 2.2, v + noise))
        })
      )
    }, 1800)
    return () => clearInterval(id)
  }, [])

  // interval 2 — countdown + fire alerts
  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current -= 1
      setNextIn(countdownRef.current)
      if (countdownRef.current <= 0) {
        countdownRef.current = 12 + Math.floor(Math.random() * 10)
        setNextIn(countdownRef.current)
        const ruleIdx = Math.floor(Math.random() * RULES.length)
        const rule    = RULES[ruleIdx]
        const trigVal = Math.floor(rule.threshold * (1.05 + Math.random() * 0.3))
        const msg     = FIRED_TEMPLATES[ruleIdx](rule, trigVal)
        setFired(prev => [{
          id:        Date.now(),
          msg,
          severity:  rule.severity,
          color:     rule.color,
          ruleLabel: rule.label,
          time:      'الآن',
        }, ...prev].slice(0, 4))
      }
    }, 1000)
    return () => clearInterval(tick)   // ← was clearInterval(id) — FIXED
  }, [])

  return (
    <div style={{
      borderRadius: '24px',
      border: `1px solid ${isDark ? '#E53E3E22' : '#E53E3E44'}`,
      background: isDark ? '#0D0D0D' : '#FFFFFF',
      overflow: 'hidden',
      boxShadow: isDark
        ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px #E53E3E11'
        : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px #E53E3E22',
    }}>
      {/* Title bar */}
      <div style={{ padding: '10px 18px', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, background: isDark ? '#111' : '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#E53E3E','#F59E0B','#2E8B57'].map(c => (
              <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <span style={{ fontSize: '0.7rem', color: isDark ? '#4B5563' : '#9CA3AF', fontWeight: 600 }}>
            Gantra — محرك التنبيهات
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '6px', background: '#E53E3E12', border: '1px solid #E53E3E30' }}>
            <Clock size={8} color="#E53E3E" />
            <span style={{ fontSize: '0.58rem', color: '#E53E3E', fontWeight: 700 }}>تقييم خلال {nextIn}ث</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', boxShadow: '0 0 6px #2E8B57', animation: 'livePulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.65rem', color: '#2E8B57', fontWeight: 700 }}>نشط</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Rules with live gauges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', margin: 0 }}>القواعد النشطة — تقييم مستمر</p>
          {RULES.map((rule, i) => {
            const val       = values[i] ?? rule.baseValue
            const pct       = Math.min(100, (val / (rule.threshold * 2)) * 100)
            const triggered = val >= rule.threshold
            const sev       = SEVERITY_CFG[rule.severity]
            const displayVal = rule.unit === '%'
              ? `${Math.round(val)}%`
              : rule.unit === 'نقطة'
              ? `${Math.round(val)} نقطة`
              : `${Math.round(val)} ${rule.unit}`

            return (
              <div key={rule.id} style={{ borderRadius: '12px', padding: '9px 11px', background: triggered ? (isDark ? rule.color + '10' : rule.color + '06') : (isDark ? '#161616' : '#F8FAFC'), border: `1px solid ${triggered ? rule.color + '40' : (isDark ? '#1E1E1E' : '#F0F0EC')}`, transition: 'all 0.5s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '6px', background: rule.color + '20', border: `1px solid ${rule.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {triggered ? <AlertTriangle size={9} color={rule.color} /> : <Bell size={9} color={rule.color} />}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: triggered ? rule.color : (isDark ? '#E5E7EB' : '#111'), flex: 1, transition: 'color 0.4s' }}>{rule.label}</span>
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, color: triggered ? rule.color : (isDark ? '#6B7280' : '#9CA3AF'), transition: 'color 0.4s' }}>{displayVal}</span>
                  {triggered && (
                    <span style={{ fontSize: '0.52rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, animation: 'pulse 1.2s infinite' }}>
                      {sev.label}
                    </span>
                  )}
                </div>
                <div style={{ height: '5px', borderRadius: '99px', background: isDark ? '#1E1E1E' : '#E5E7EB', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', borderRadius: '99px', width: `${pct}%`, background: triggered ? `linear-gradient(to left, ${rule.color}, ${rule.color}88)` : (isDark ? '#374151' : '#D1D5DB'), transition: 'width 1.2s ease, background 0.5s ease', boxShadow: triggered ? `0 0 8px ${rule.color}60` : 'none' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: isDark ? '#4B5563' : '#C4C4C4', opacity: 0.6 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '0.48rem', color: isDark ? '#374151' : '#D1D5DB' }}>0</span>
                  <span style={{ fontSize: '0.48rem', color: isDark ? '#374151' : '#D1D5DB' }}>الحد: {rule.threshold}{rule.unit === '%' ? '%' : ''}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Fired alerts feed */}
        <div style={{ borderRadius: '12px', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, overflow: 'hidden' }}>
          <div style={{ padding: '7px 12px', background: isDark ? '#161616' : '#F8FAFC', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={10} color="#E53E3E" />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', flex: 1 }}>تنبيهات مُطلَقة حديثاً</span>
            {fired.length > 0 && (
              <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: '5px', background: '#E53E3E18', color: '#E53E3E', border: '1px solid #E53E3E30' }}>{fired.length}</span>
            )}
          </div>
          {fired.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: isDark ? '#374151' : '#D1D5DB' }}>في انتظار تجاوز الحدود…</span>
            </div>
          ) : (
            fired.map((f, i) => (
              <div key={f.id} style={{ padding: '8px 12px', borderBottom: i < fired.length - 1 ? `1px solid ${isDark ? '#1A1A1A' : '#F5F5F3'}` : 'none', animation: i === 0 ? 'slideIn 0.35s ease' : 'none', background: i === 0 ? (isDark ? '#E53E3E08' : '#E53E3E04') : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, background: f.color + '18', border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                    <AlertTriangle size={9} color={f.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: f.color, margin: '0 0 2px' }}>{f.ruleLabel}</p>
                    <p style={{ fontSize: '0.58rem', lineHeight: 1.45, color: isDark ? '#9CA3AF' : '#374151', margin: 0 }}>{f.msg}</p>
                  </div>
                  <span style={{ fontSize: '0.5rem', color: isDark ? '#374151' : '#D1D5DB', flexShrink: 0, marginTop: '2px' }}>{f.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Public Navbar ────────────────────────────────────────────────────────────

function PublicNavbar({ ui, isDark }) {
  const { t }           = useTranslation()
  const { i18n }        = useTranslation()
  const { toggleTheme } = useTheme()
  const navigate        = useNavigate()
  const [productsOpen, setProductsOpen] = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const productsRef = useRef(null)

  const changeLanguage = lng => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18nextLng', lng)
  }

  useEffect(() => {
    const handler = e => {
      if (productsRef.current && !productsRef.current.contains(e.target))
        setProductsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const PRODUCTS = [
    { icon: Activity,   label: t('navigation.socialListening', 'الرصد الاجتماعي'), path: '/products/social-listening',   desc: 'رصد المنشورات عبر المنصات'              },
    { icon: ThumbsDown, label: t('navigation.sentiment',       'تحليل المشاعر'),   path: '/products/sentiment-analysis', desc: 'تحليل باللهجة الجزائرية والمغاربية'    },
    { icon: Hash,       label: t('navigation.topics',          'المواضيع'),         path: '/products/topics',             desc: 'اكتشاف الترندات تلقائياً'              },
    { icon: Bell,       label: t('navigation.alerts',          'التنبيهات'),        path: '/products/alerts',             desc: 'تنبيهات عند ارتفاع المشاعر السلبية'   },
    { icon: BarChart2,  label: t('navigation.engagement',      'التفاعل'),          path: '/products/engagement',         desc: 'إحصاءات التفاعل والانتشار'            },
  ]

  const nb = {
    bg:     isDark ? 'rgba(10,10,10,0.88)'  : 'rgba(248,250,252,0.92)',
    border: isDark ? '#1E1E1E' : '#E2E8F0',
    muted:  isDark ? '#6B7280' : '#64748B',
  }

  return (
    <>
      <style>{`
        .pub-nav-links-al { display: flex; }
        .pub-nav-hamburger-al { display: none !important; }
        @media (max-width: 860px) {
          .pub-nav-links-al { display: none !important; }
          .pub-nav-hamburger-al { display: flex !important; }
        }
      `}</style>

      <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, borderBottom: `1px solid ${nb.border}`, background: nb.bg, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>

          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={gantraLogo} alt="Gantra" style={{ height: '42px', filter: isDark ? 'none' : 'brightness(0.85)' }} />
          </NavLink>

          <div className="pub-nav-links-al" style={{ alignItems: 'center', gap: '4px' }}>
            <div ref={productsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProductsOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '10px', border: 'none', background: productsOpen ? (isDark ? '#E53E3E14' : '#E53E3E10') : 'transparent', color: productsOpen ? '#E53E3E' : nb.muted, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!productsOpen) e.currentTarget.style.color = '#E53E3E' }}
                onMouseLeave={e => { if (!productsOpen) e.currentTarget.style.color = nb.muted }}
              >
                {t('home.nav.products', 'المنتجات')}
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: productsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {productsOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '280px', background: isDark ? '#111' : '#fff', border: `1px solid ${nb.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: isDark ? '0 20px 48px rgba(0,0,0,0.5)' : '0 20px 48px rgba(0,0,0,0.12)', zIndex: 100 }}>
                  <div style={{ padding: '8px' }}>
                    {PRODUCTS.map(p => {
                      const Icon = p.icon
                      return (
                        <div key={p.label} onClick={() => { navigate(p.path); setProductsOpen(false) }}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? '#E53E3E0D' : '#E53E3E08'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#E53E3E14', border: '1px solid #E53E3E25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color="#E53E3E" />
                          </div>
                          <div>
                            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: isDark ? '#E5E7EB' : '#111', margin: 0 }}>{p.label}</p>
                            <p style={{ fontSize: '0.7rem', color: nb.muted, margin: 0 }}>{p.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/about"
              style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: nb.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#E53E3E'}
              onMouseLeave={e => e.currentTarget.style.color = nb.muted}
            >{t('home.nav.about', 'من نحن')}</NavLink>

            <NavLink to="/contact-us"
              style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: nb.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#E53E3E'}
              onMouseLeave={e => e.currentTarget.style.color = nb.muted}
            >{t('footer.contactUs', 'تواصل معنا')}</NavLink>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select onChange={e => changeLanguage(e.target.value)} value={i18n.language?.slice(0, 2)}
              style={{ background: isDark ? '#1A1A1A' : '#F0F0EC', color: isDark ? '#E5E7EB' : '#111', border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`, borderRadius: '8px', padding: '5px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
            >
              <option value="ar">AR</option>
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>

            <button onClick={toggleTheme} style={{ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`, background: isDark ? '#1A1A1A' : '#F0F0EC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
              {isDark ? '☀️' : '🌙'}
            </button>

            <NavLink to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', padding: '8px 18px', fontSize: '0.83rem', fontWeight: 700, background: '#2E8B57', color: '#fff', textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3DAA6A'}
              onMouseLeave={e => e.currentTarget.style.background = '#2E8B57'}
            >{t('navigation.login', 'تسجيل الدخول')}</NavLink>

            <button className="pub-nav-hamburger-al" onClick={() => setMobileOpen(v => !v)}
              style={{ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`, background: isDark ? '#1A1A1A' : '#F0F0EC', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${nb.border}`, background: isDark ? '#0A0A0A' : '#F8FAFC', padding: '12px 1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E53E3E', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              {t('home.nav.products', 'المنتجات')}
            </p>
            {PRODUCTS.map(p => (
              <div key={p.label} onClick={() => { navigate(p.path); setMobileOpen(false) }}
                style={{ padding: '10px 0', borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F0F0EC'}`, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111' }}
              >{p.label}</div>
            ))}
            <NavLink to="/about" onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '10px 0', borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F0F0EC'}`, fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111', textDecoration: 'none' }}
            >{t('home.nav.about', 'من نحن')}</NavLink>
            <NavLink to="/contact-us" onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '10px 0', fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111', textDecoration: 'none' }}
            >{t('footer.contactUs', 'تواصل معنا')}</NavLink>
          </div>
        )}
      </header>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AlertsProductPage() {
  const { t }           = useTranslation()
  const { currentLang } = useLanguage()
  const { theme }       = useTheme()
  const isDark          = theme === 'dark'
  const [isVisible, setIsVisible] = useState(false)

  const ui = {
    bg:       isDark ? '#0A0A0A' : '#F8FAFC',
    surface:  isDark ? '#111111' : '#FFFFFF',
    surface2: isDark ? '#161616' : '#F1F5F9',
    border:   isDark ? '#1E1E1E' : '#E2E8F0',
    text:     isDark ? '#E5E7EB' : '#0F172A',
    muted:    isDark ? '#6B7280' : '#64748B',
    subtle:   isDark ? '#9CA3AF' : '#475569',
  }

  useEffect(() => { setIsVisible(true) }, [])

  const FEATURES = [
    { icon: AlertTriangle, color: '#E53E3E', title: t('alertsPage.features.autoTriggerTitle', 'تنبيهات تلقائية فورية'),        desc: t('alertsPage.features.autoTriggerDesc', 'يُطلق النظام تنبيهاً فورياً بعد كل عملية جمع بيانات حين تُتجاوز القواعد المحددة.') },
    { icon: Filter,        color: '#F59E0B', title: t('alertsPage.features.rulesTitle',        'قواعد مرنة وقابلة للتخصيص'),   desc: t('alertsPage.features.rulesDesc',        'أنشئ قواعد تتحكم في نوع التنبيه وحدّه وخطورته — كل شيء قابل للضبط الدقيق.') },
    { icon: TrendingDown,  color: '#8B5CF6', title: t('alertsPage.features.sentimentDropTitle','رصد انهيار المشاعر'),           desc: t('alertsPage.features.sentimentDropDesc','يكتشف النظام الانخفاض الحاد في الإيجابي مقارنة باليوم السابق ويُنبّهك فوراً.') },
    { icon: Globe,         color: '#4A90D9', title: t('alertsPage.features.multiRuleTitle',    'أنواع متعددة من القواعد'),      desc: t('alertsPage.features.multiRuleDesc',    'سبعة أنواع من قواعد التنبيه تغطي نسبة السلبي والحجم والكلمات المفتاحية والانخفاض المفاجئ.') },
    { icon: Bell,          color: '#2E8B57', title: t('alertsPage.features.historyTitle',      'سجل الإشعارات'),                desc: t('alertsPage.features.historyDesc',      'كل تنبيه يُخزَّن في سجل مفصّل مع التوقيت والقيمة التي أطلقته لمراجعته لاحقاً.') },
    { icon: Shield,        color: '#C9A84C', title: t('alertsPage.features.reputationTitle',   'حماية استباقية للسمعة'),        desc: t('alertsPage.features.reputationDesc',   'اكتشف الأزمات قبل انتشارها — التنبيهات المبكرة تمنحك وقتاً للرد الاحترافي.') },
  ]

  const STEPS = [
    { num: '01', accent: '#E53E3E', title: t('alertsPage.steps.step1Title', 'أنشئ قاعدة تنبيه'),       desc: t('alertsPage.steps.step1Desc', 'حدّد نوع القاعدة والحدّ الذي يُطلق التنبيه عند تجاوزه، وخطورتها (منخفض / متوسط / عالٍ).') },
    { num: '02', accent: '#F59E0B', title: t('alertsPage.steps.step2Title', 'النظام يراقب تلقائياً'),  desc: t('alertsPage.steps.step2Desc', 'بعد كل عملية جمع بيانات، يُقيَّم كل قاعدة مقارنةً بالبيانات الجديدة تلقائياً.') },
    { num: '03', accent: '#2E8B57', title: t('alertsPage.steps.step3Title', 'تلقّ الإشعار فوراً'),     desc: t('alertsPage.steps.step3Desc', 'عند تجاوز الحدّ، يُطلَق التنبيه ويُضاف إلى سجل الإشعارات مع تفاصيل كاملة.') },
  ]

  const RULE_TYPES = [
    { label: t('alertsPage.ruleTypes.negativePct',   'نسبة السلبي تتجاوز الحد'),           color: '#E53E3E' },
    { label: t('alertsPage.ruleTypes.positiveBelow',  'نسبة الإيجابي تنخفض عن الحد'),      color: '#F59E0B' },
    { label: t('alertsPage.ruleTypes.volumeSpike',    'حجم منشورات اليوم يتجاوز الحد'),    color: '#8B5CF6' },
    { label: t('alertsPage.ruleTypes.keywordSpike',   'كلمة مفتاحية تتجاوز الحد'),         color: '#4A90D9' },
    { label: t('alertsPage.ruleTypes.sentimentDrop',  'انخفاض حاد في الإيجابي'),            color: '#2E8B57' },
    { label: t('alertsPage.ruleTypes.negativeStreak', 'السلبي الغالب لأيام متتالية'),       color: '#C9A84C' },
    { label: t('alertsPage.ruleTypes.negativeCount',  'عدد السلبيات يتجاوز الحد اليومي'),  color: '#E53E3E' },
  ]

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes slideIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .al-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .al-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .al-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .al-rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        @media (max-width: 900px) {
          .al-hero-grid     { grid-template-columns: 1fr; }
          .al-features-grid { grid-template-columns: repeat(2, 1fr); }
          .al-stats-grid    { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .al-features-grid { grid-template-columns: 1fr; }
          .al-stats-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <PublicNavbar ui={ui} isDark={isDark} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '6rem', paddingTop: '6rem', paddingBottom: '5rem' }}>

        {/* ── HERO ── */}
        <section
          className="al-hero-grid"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', width: 'fit-content', border: '1px solid rgba(229,62,62,0.4)', background: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E53E3E', animation: 'pulse 2s infinite' }} />
              {t('alertsPage.hero.badge', 'التنبيهات')}
            </span>

            <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 900, lineHeight: 1.2, margin: 0, color: ui.text, letterSpacing: '-0.02em' }}>
              {t('alertsPage.hero.titlePre', 'كن أول من يعرف حين')}{' '}
              <span style={{ background: 'linear-gradient(135deg, #E53E3E, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('alertsPage.hero.titleHighlight', 'ترتفع المشاعر السلبية')}
              </span>
              {' '}{t('alertsPage.hero.titleEnd', 'حول علامتك')}
            </h1>

            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: ui.muted, margin: 0, maxWidth: '480px' }}>
              {t('alertsPage.hero.description', 'أنشئ قواعد تنبيه ذكية تُطلَق تلقائياً بعد كل عملية جمع بيانات — لحماية سمعة علامتك قبل أن تتفاقم الأزمة.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { text: t('alertsPage.hero.check1', '7 أنواع من قواعد التنبيه المرنة والقابلة للتخصيص'), color: '#E53E3E' },
                { text: t('alertsPage.hero.check2', 'تقييم تلقائي بعد كل عملية جمع بيانات'),             color: '#F59E0B' },
                { text: t('alertsPage.hero.check3', 'سجل كامل للإشعارات مع التوقيت والتفاصيل'),          color: '#8B5CF6' },
              ].map(({ text, color }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: color + '18', border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color={color} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '0.83rem', color: ui.subtle, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <NavLink to="/request-access"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, background: '#E53E3E', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(229,62,62,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F05252'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#E53E3E'; e.currentTarget.style.transform = 'translateY(0)' }}
              >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

              <NavLink to="/"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E53E3E'; e.currentTarget.style.color = '#E53E3E' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
              >
                <ArrowLeft size={14} />
                {t('alertsPage.hero.backHome', 'الرئيسية')}
              </NavLink>
            </div>
          </div>

          <div style={{ animation: isVisible ? 'fadeUp 0.9s ease 0.2s both' : 'none' }}>
            <AlertsSimulation isDark={isDark} />
          </div>
        </section>

        {/* ── RULE TYPES ── */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(229,62,62,0.35)', background: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontSize: '0.75rem', fontWeight: 700 }}>
              <Filter size={12} />
              {t('alertsPage.ruleTypes.badge', 'أنواع القواعد')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('alertsPage.ruleTypes.title', '7 أنواع من قواعد التنبيه')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('alertsPage.ruleTypes.subtitle', 'تغطي كل سيناريوهات مراقبة السمعة — من النسب إلى الكلمات المفتاحية')}
            </p>
          </div>
          <div className="al-rules-grid">
            {RULE_TYPES.map((r, i) => (
              <div key={r.label}
                style={{ borderRadius: '14px', padding: '12px 14px', border: `1px solid ${ui.border}`, background: ui.surface, display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = r.color + '55'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: r.color + '18', border: `1px solid ${r.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={12} color={r.color} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: ui.subtle, lineHeight: 1.4 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to left, #2E8B57, #F59E0B, #E53E3E)' }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('alertsPage.steps.badge', 'كيف يعمل')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('alertsPage.steps.title', 'من إعداد القاعدة إلى الإشعار الفوري')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('alertsPage.steps.subtitle', 'الإعداد مرة واحدة — التقييم يعمل تلقائياً إلى ما لا نهاية')}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ textAlign: 'center', padding: '1.5rem 1rem', animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '18px', background: s.accent + '15', border: `1px solid ${s.accent}30`, color: s.accent, fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem' }}>{s.num}</div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: ui.text, margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: ui.muted, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(229,62,62,0.35)', background: 'rgba(229,62,62,0.08)', color: '#E53E3E', fontSize: '0.75rem', fontWeight: 700 }}>
              <Zap size={12} />
              {t('alertsPage.features.badge', 'المزايا')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t('alertsPage.features.title', 'لماذا التنبيهات من Gantra؟')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: ui.muted, margin: '0 auto', maxWidth: '520px' }}>
              {t('alertsPage.features.subtitle', 'مراقبة استباقية تحمي سمعتك قبل أن تتفاقم الأزمة')}
            </p>
          </div>
          <div className="al-features-grid">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={f.title}
                  style={{ borderRadius: '20px', padding: '1.5rem', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative', overflow: 'hidden', transition: 'all 0.25s', animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '60'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${f.color}15` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: f.color }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '13px', background: f.color + '18', border: `1px solid ${f.color}30`, color: f.color, marginBottom: '1rem' }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: ui.text, margin: '0 0 8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: ui.muted, margin: 0 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={{ borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(229,62,62,0.2)', background: isDark ? 'rgba(229,62,62,0.04)' : 'rgba(229,62,62,0.03)' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#E53E3E', opacity: 0.06, filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#F59E0B', opacity: 0.06, filter: 'blur(50px)' }} />
          <div className="al-stats-grid" style={{ position: 'relative' }}>
            {[
              { value: '7',    label: t('alertsPage.stats.ruleTypes', 'أنواع من القواعد'),  sub: t('alertsPage.stats.ruleTypesSub', 'تغطي كل سيناريوهات المراقبة'),  color: '#E53E3E', icon: Filter        },
              { value: '∞',    label: t('alertsPage.stats.auto',      'تقييم تلقائي'),       sub: t('alertsPage.stats.autoSub',      'بعد كل عملية جمع بيانات'),      color: '#F59E0B', icon: RefreshCw     },
              { value: '3',    label: t('alertsPage.stats.severity',  'مستويات خطورة'),      sub: t('alertsPage.stats.severitySub',  'منخفض · متوسط · عالٍ'),         color: '#8B5CF6', icon: AlertTriangle },
              { value: '100%', label: t('alertsPage.stats.uptime',    'دقة التقييم'),         sub: t('alertsPage.stats.uptimeSub',    'لا يفوت أي تجاوز للحدود'),      color: '#2E8B57', icon: Target        },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.label}
                  style={{ padding: '1.5rem', borderRadius: '20px', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative', overflow: 'hidden', animation: `fadeUp 0.5s ease ${i * 0.1}s both`, transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '50'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: s.color }} />
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.color + '15', border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <Icon size={16} color={s.color} />
                  </div>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: s.color, margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '0.78rem', color: ui.text, margin: '0 0 3px', fontWeight: 700 }}>{s.label}</p>
                  <p style={{ fontSize: '0.68rem', color: ui.muted, margin: 0 }}>{s.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ borderRadius: '28px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(229,62,62,0.25)', background: isDark ? 'linear-gradient(135deg, rgba(229,62,62,0.08) 0%, rgba(245,158,11,0.08) 100%)' : 'linear-gradient(135deg, rgba(229,62,62,0.06) 0%, rgba(245,158,11,0.06) 100%)' }}>
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#E53E3E', opacity: 0.05, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#F59E0B', opacity: 0.05, filter: 'blur(60px)' }} />
          <img src={gantraLogo} alt="Gantra" style={{ height: '60px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {t('alertsPage.cta.title', 'احمِ سمعة علامتك قبل فوات الأوان')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: ui.muted, margin: '0 auto 2rem', maxWidth: '440px', lineHeight: 1.75 }}>
            {t('alertsPage.cta.description', 'راسلنا للحصول على وصول تجريبي وجرّب نظام التنبيهات على بيانات علامتك الجزائرية.')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <NavLink to="/request-access"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '13px 32px', fontSize: '0.93rem', fontWeight: 700, background: '#E53E3E', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(229,62,62,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F05252'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#E53E3E'; e.currentTarget.style.transform = 'translateY(0)' }}
            >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

            <NavLink to="/contact-us"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '13px 28px', fontSize: '0.93rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E53E3E'; e.currentTarget.style.color = '#E53E3E' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
            >{t('footer.contactUs', 'تواصل معنا')}</NavLink>
          </div>
        </section>

      </div>
    </div>
  )
}