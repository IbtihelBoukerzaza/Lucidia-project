import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart2, ChevronDown, Menu, X, Activity, ThumbsUp,
  Radio, Camera, Play, Heart, MessageCircle, Share2, Eye,
  TrendingUp, Users, Bell, Hash, Brain, ArrowRight,
  BarChart, Target, Zap,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo (2).png'

// ─── Fake engagement data ─────────────────────────────────────────────────────

const PLATFORM_CFG = {
  facebook:  { label: 'Facebook',  color: '#4F46E5', icon: Radio  },
  instagram: { label: 'Instagram', color: '#EC4899', icon: Camera },
  tiktok:    { label: 'TikTok',    color: '#14B8A6', icon: Play   },
}

const FAKE_POSTS = [
  { platform: 'facebook',  text: 'اتصالات الجزائر تُطلق باقة إنترنت جديدة بأسعار تنافسية 🔥', base: { likes: 1240, comments: 87,  shares: 203,  views: 18400  } },
  { platform: 'instagram', text: 'شاركنا تجربتك مع موبيليس واربح جوائز قيّمة 🎁',             base: { likes: 3870, comments: 412, shares: 91,   views: 54200  } },
  { platform: 'tiktok',    text: 'عرض حصري من جيزي — الاشتراك المجاني لمدة 3 أيام 📱',         base: { likes: 9120, comments: 744, shares: 1830, views: 127000 } },
  { platform: 'facebook',  text: 'الدعم الفني يرد خلال 5 دقائق — جرّب الآن 💬',               base: { likes: 660,  comments: 195, shares: 44,   views: 9300   } },
  { platform: 'instagram', text: 'سرعة 4G في مناطق جديدة — تحقق من تغطيتك الآن 🗺️',           base: { likes: 2100, comments: 98,  shares: 347,  views: 31600  } },
]

// ─── Engagement Simulation ────────────────────────────────────────────────────

function EngagementSimulation({ isDark }) {
  const [metrics,    setMetrics]    = useState(FAKE_POSTS.map(p => ({ ...p, current: { ...p.base } })))
  const [activePost, setActivePost] = useState(0)
  const [pulse,      setPulse]      = useState(null)
  const [totals,     setTotals]     = useState({ likes: 0, comments: 0, shares: 0, views: 0 })
  const intervalRef = useRef(null)

  useEffect(() => {
    const init = FAKE_POSTS.reduce(
      (acc, p) => ({
        likes:    acc.likes    + p.base.likes,
        comments: acc.comments + p.base.comments,
        shares:   acc.shares   + p.base.shares,
        views:    acc.views    + p.base.views,
      }),
      { likes: 0, comments: 0, shares: 0, views: 0 }
    )
    setTotals(init)

    intervalRef.current = setInterval(() => {
      const idx   = Math.floor(Math.random() * FAKE_POSTS.length)
      const field = ['likes', 'comments', 'shares', 'views'][Math.floor(Math.random() * 4)]
      const delta = field === 'views'
        ? Math.floor(Math.random() * 80) + 20
        : Math.floor(Math.random() * 8) + 1

      setMetrics(prev =>
        prev.map((p, i) =>
          i === idx ? { ...p, current: { ...p.current, [field]: p.current[field] + delta } } : p
        )
      )
      setTotals(prev => ({ ...prev, [field]: prev[field] + delta }))
      setPulse(`${idx}-${field}`)
      setTimeout(() => setPulse(null), 600)
    }, 900)

    return () => clearInterval(intervalRef.current)
  }, [])

  const post   = metrics[activePost]
  const PIcon  = PLATFORM_CFG[post.platform].icon
  const pColor = PLATFORM_CFG[post.platform].color
  const engRate = (
    ((post.current.likes + post.current.comments + post.current.shares) / post.current.views) * 100
  ).toFixed(2)

  const platformTotals = metrics.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + p.current.likes + p.current.comments + p.current.shares
    return acc
  }, {})
  const grandTotal = Object.values(platformTotals).reduce((a, v) => a + v, 0)

  return (
    <div style={{
      borderRadius: '24px',
      border: `1px solid ${isDark ? '#C9A84C22' : '#C9A84C44'}`,
      background: isDark ? '#0D0D0D' : '#FFFFFF',
      overflow: 'hidden',
      boxShadow: isDark
        ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px #C9A84C11'
        : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px #C9A84C22',
    }}>
      {/* Window chrome */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, background: isDark ? '#111' : '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#E53E3E', '#F59E0B', '#2E8B57'].map(c => (
              <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: isDark ? '#4B5563' : '#9CA3AF', fontWeight: 600 }}>
            Gantra — لوحة التفاعل المباشرة
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 6px #8B5CF6', animation: 'livePulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.68rem', color: '#8B5CF6', fontWeight: 700 }}>مباشر</span>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Global KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {[
            { label: 'إعجابات', value: totals.likes.toLocaleString(),           color: '#EC4899', Icon: Heart         },
            { label: 'تعليقات', value: totals.comments.toLocaleString(),        color: '#4A90D9', Icon: MessageCircle },
            { label: 'مشاركات', value: totals.shares.toLocaleString(),          color: '#2E8B57', Icon: Share2        },
            { label: 'مشاهدات', value: (totals.views / 1000).toFixed(1) + 'K', color: '#C9A84C', Icon: Eye           },
          ].map(k => (
            <div key={k.label} style={{ borderRadius: '10px', padding: '8px 6px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, textAlign: 'center' }}>
              <k.Icon size={11} color={k.color} style={{ display: 'block', margin: '0 auto 3px' }} />
              <p style={{ fontSize: '0.82rem', fontWeight: 900, color: k.color, margin: '0 0 1px', lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontSize: '0.54rem', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0 }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Post selector tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {metrics.map((p, i) => {
            const PlatIcon = PLATFORM_CFG[p.platform].icon
            const pCol     = PLATFORM_CFG[p.platform].color
            return (
              <button key={i} onClick={() => setActivePost(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '3px 9px', borderRadius: '7px',
                  border: `1px solid ${i === activePost ? pCol + '60' : (isDark ? '#2A2A2A' : '#E5E7EB')}`,
                  background: i === activePost ? pCol + '18' : 'transparent',
                  cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700,
                  color: i === activePost ? pCol : (isDark ? '#6B7280' : '#9CA3AF'),
                  transition: 'all 0.2s',
                }}
              >
                <PlatIcon size={9} />
                منشور {i + 1}
              </button>
            )
          })}
        </div>

        {/* Active post card */}
        <div style={{ borderRadius: '12px', border: `1px solid ${pColor}35`, background: isDark ? '#111' : '#FAFAF8', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: pColor + '12', borderBottom: `1px solid ${pColor}20`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, background: pColor + '20', border: `1px solid ${pColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PIcon size={12} color={pColor} />
            </div>
            <p style={{ fontSize: '0.7rem', lineHeight: 1.5, color: isDark ? '#D1D5DB' : '#374151', margin: 0, flex: 1 }}>
              {post.text}
            </p>
          </div>

          <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { label: 'إعجاب',  value: post.current.likes,    pulseKey: `${activePost}-likes`,    color: '#EC4899', Icon: Heart         },
              { label: 'تعليق',  value: post.current.comments, pulseKey: `${activePost}-comments`, color: '#4A90D9', Icon: MessageCircle },
              { label: 'مشاركة', value: post.current.shares,   pulseKey: `${activePost}-shares`,   color: '#2E8B57', Icon: Share2        },
              { label: 'مشاهدة', value: post.current.views,    pulseKey: `${activePost}-views`,    color: '#C9A84C', Icon: Eye           },
            ].map(m => (
              <div key={m.label} style={{
                textAlign: 'center', padding: '6px', borderRadius: '8px',
                background: pulse === m.pulseKey ? m.color + '22' : 'transparent',
                transition: 'background 0.3s',
              }}>
                <m.Icon size={12} color={m.color} style={{ display: 'block', margin: '0 auto' }} />
                <p style={{ fontSize: '0.78rem', fontWeight: 900, color: m.color, margin: '3px 0 1px', lineHeight: 1, transition: 'all 0.3s' }}>
                  {m.value >= 1000 ? (m.value / 1000).toFixed(1) + 'K' : m.value}
                </p>
                <p style={{ fontSize: '0.54rem', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0 }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Engagement rate bar */}
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${isDark ? '#1A1A1A' : '#F0F0EC'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.6rem', color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: 700, flexShrink: 0 }}>معدل التفاعل</span>
            <div style={{ flex: 1, height: '5px', borderRadius: '999px', background: isDark ? '#1E1E1E' : '#F0F0F0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(parseFloat(engRate) * 10, 100)}%`, background: 'linear-gradient(to left, #8B5CF6, #C9A84C)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8B5CF6', flexShrink: 0 }}>{engRate}%</span>
          </div>
        </div>

        {/* Platform breakdown */}
        <div style={{ borderRadius: '12px', padding: '10px 14px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}` }}>
          <p style={{ fontSize: '0.62rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', margin: '0 0 8px' }}>توزيع التفاعل حسب المنصة</p>
          {Object.entries(platformTotals).map(([plat, val]) => {
            const pct      = Math.round((val / grandTotal) * 100)
            const PlatIcon = PLATFORM_CFG[plat].icon
            const pCol     = PLATFORM_CFG[plat].color
            return (
              <div key={plat} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <PlatIcon size={10} color={pCol} />
                  <span style={{ fontSize: '0.6rem', color: isDark ? '#9CA3AF' : '#6B7280', flex: 1 }}>
                    {PLATFORM_CFG[plat].label}
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: pCol }}>{pct}%</span>
                </div>
                <div style={{ height: '4px', borderRadius: '999px', background: isDark ? '#1E1E1E' : '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pCol, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

// ─── Public Navbar ────────────────────────────────────────────────────────────

function PublicNavbar({ ui, isDark }) {
  const { t }           = useTranslation()
  const { toggleTheme } = useTheme()
  const { i18n }        = useTranslation()
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
    { icon: Activity,  label: t('navigation.socialListening', 'الرصد الاجتماعي'), path: '/products/social-listening',   desc: 'رصد المنشورات عبر المنصات'            },
    { icon: ThumbsUp,  label: t('navigation.sentiment',       'تحليل المشاعر'),   path: '/products/sentiment-analysis', desc: 'تحليل باللهجة الجزائرية والمغاربية'  },
    { icon: Hash,      label: t('navigation.topics',          'المواضيع'),         path: '/products/topics',             desc: 'اكتشاف الترندات تلقائياً'            },
    { icon: Bell,      label: t('navigation.alerts',          'التنبيهات'),        path: '/products/alerts',             desc: 'تنبيهات عند ارتفاع المشاعر السلبية' },
    { icon: BarChart2, label: t('navigation.engagement',      'التفاعل'),          path: '/products/profiles',           desc: 'إحصاءات التفاعل والانتشار'          },
  ]

  const nb = {
    bg:     isDark ? 'rgba(10,10,10,0.88)'  : 'rgba(248,250,252,0.92)',
    border: isDark ? '#1E1E1E' : '#E2E8F0',
    muted:  isDark ? '#6B7280' : '#64748B',
  }

  return (
    <>
      <style>{`
        .pub-nav-links-pr     { display: flex; }
        .pub-nav-hamburger-pr { display: none !important; }
        @media (max-width: 860px) {
          .pub-nav-links-pr     { display: none !important; }
          .pub-nav-hamburger-pr { display: flex !important; }
        }
      `}</style>

      <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, borderBottom: `1px solid ${nb.border}`, background: nb.bg, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>

          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={gantraLogo} alt="Gantra" style={{ height: '42px', filter: isDark ? 'none' : 'brightness(0.85)' }} />
          </NavLink>

          <div className="pub-nav-links-pr" style={{ alignItems: 'center', gap: '4px' }}>
            <div ref={productsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProductsOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '10px', border: 'none', background: productsOpen ? (isDark ? '#C9A84C14' : '#C9A84C10') : 'transparent', color: productsOpen ? '#C9A84C' : nb.muted, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!productsOpen) e.currentTarget.style.color = '#C9A84C' }}
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
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? '#C9A84C0D' : '#C9A84C08'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#C9A84C14', border: '1px solid #C9A84C25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color="#C9A84C" />
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
              onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
              onMouseLeave={e => e.currentTarget.style.color = nb.muted}
            >{t('home.nav.about', 'من نحن')}</NavLink>

            <NavLink to="/contact-us"
              style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: nb.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
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

            <button className="pub-nav-hamburger-pr" onClick={() => setMobileOpen(v => !v)}
              style={{ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`, background: isDark ? '#1A1A1A' : '#F0F0EC', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${nb.border}`, background: isDark ? '#0A0A0A' : '#F8FAFC', padding: '12px 1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
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

export default function ProfilesPage() {
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

  const ACCENT = '#8B5CF6'

  useEffect(() => { setIsVisible(true) }, [])

  const FEATURES = [
    { icon: Heart,      color: '#EC4899', title: t('engagementPage.features.reactions.title', 'قياس ردود الفعل'),   desc: t('engagementPage.features.reactions.desc', 'تتبّع الإعجابات والتعليقات والمشاركات في الوقت الفعلي عبر جميع المنصات المدعومة.') },
    { icon: TrendingUp, color: '#2E8B57', title: t('engagementPage.features.trending.title',  'أبرز المنشورات'),    desc: t('engagementPage.features.trending.desc',  'تحديد المنشورات الأعلى تفاعلاً وتتبّع أدائها مقارنةً بمنافسيك في السوق.') },
    { icon: BarChart,   color: '#4A90D9', title: t('engagementPage.features.breakdown.title', 'تفصيل حسب المنصة'), desc: t('engagementPage.features.breakdown.desc',  'مقارنة بيانات التفاعل عبر Facebook وInstagram وTikTok في لوحة موحّدة.') },
    { icon: Target,     color: '#C9A84C', title: t('engagementPage.features.rate.title',      'معدل التفاعل'),      desc: t('engagementPage.features.rate.desc',       'حساب معدل التفاعل آلياً مقسوماً على المشاهدات للحصول على صورة دقيقة لكل منشور.') },
    { icon: Users,      color: ACCENT,    title: t('engagementPage.features.audience.title',  'فهم الجمهور'),       desc: t('engagementPage.features.audience.desc',   'معرفة أوقات الذروة وأنواع المحتوى التي تحقق أعلى تفاعل مع جمهورك المستهدف.') },
    { icon: Zap,        color: '#F59E0B', title: t('engagementPage.features.alerts.title',    'تنبيهات الانتشار'), desc: t('engagementPage.features.alerts.desc',     'تلقّي إشعار فوري عندما يشهد أحد منشوراتك ارتفاعاً مفاجئاً في التفاعل أو الانتشار.') },
  ]

  const STEPS = [
    { num: '01', accent: '#2E8B57', title: t('engagementPage.steps.step1.title', 'ربط المنصات'),    desc: t('engagementPage.steps.step1.desc', 'يجمع Gantra بيانات التفاعل تلقائياً من المنصات التي تراقبها دون أي إعداد يدوي.') },
    { num: '02', accent: ACCENT,    title: t('engagementPage.steps.step2.title', 'تحليل البيانات'), desc: t('engagementPage.steps.step2.desc', 'تُعالَج الإعجابات والتعليقات والمشاركات والمشاهدات لكل منشور وتُحسب المعدلات آلياً.') },
    { num: '03', accent: '#C9A84C', title: t('engagementPage.steps.step3.title', 'عرض التقارير'),  desc: t('engagementPage.steps.step3.desc', 'استعرض بيانات التفاعل في لوحة واضحة مع رسوم بيانية وتقارير قابلة للتصدير.') },
  ]

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .eng-hero-grid     { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }
        .eng-features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
        .eng-steps-grid    { display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem; }
        @media (max-width:900px) {
          .eng-hero-grid     { grid-template-columns:1fr; }
          .eng-features-grid { grid-template-columns:repeat(2,1fr); }
          .eng-steps-grid    { grid-template-columns:1fr; }
        }
        @media (max-width:560px) {
          .eng-features-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <PublicNavbar ui={ui} isDark={isDark} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '6rem', paddingTop: '6rem', paddingBottom: '5rem' }}>

        {/* ── HERO ── */}
        <section
          className="eng-hero-grid"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', width: 'fit-content', border: `1px solid ${ACCENT}40`, background: `${ACCENT}12`, color: ACCENT, fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT, animation: 'pulse 2s infinite' }} />
              {t('engagementPage.badge', 'تحليل التفاعل في الوقت الفعلي')}
            </span>

            <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 900, lineHeight: 1.2, margin: 0, color: ui.text, letterSpacing: '-0.02em' }}>
              {t('engagementPage.hero.titlePre', 'اقرأ')}{' '}
              <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #EC4899)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('engagementPage.hero.titleAccent', 'نبض تفاعل')}
              </span>
              {' '}{t('engagementPage.hero.titlePost', 'جمهورك مع علامتك')}
            </h1>

            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: ui.muted, margin: 0, maxWidth: '480px' }}>
              {t('engagementPage.hero.description', 'رصّد الإعجابات والتعليقات والمشاركات والمشاهدات عبر منصات التواصل الاجتماعي في لوحة واحدة، واكتشف أي المنشورات تحقق أعلى تفاعل مع جمهورك الجزائري.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <NavLink to="/request-access"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, background: ACCENT, color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: `0 4px 20px ${ACCENT}40` }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = ACCENT;    e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {t('home.requestTrial', 'اطلب وصولاً تجريبياً')}
                  <ArrowRight size={16} />
                </NavLink>
                <NavLink to="/login"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
                >
                  {t('navigation.login', 'تسجيل الدخول')}
                </NavLink>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: t('engagementPage.hero.stat1', 'تحليل فوري'), color: '#EC4899' },
                  { label: t('engagementPage.hero.stat2', '4 منصات'),    color: '#4A90D9' },
                  { label: t('engagementPage.hero.stat3', 'تقارير PDF'), color: '#2E8B57' },
                ].map(badge => (
                  <span key={badge.label} style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${badge.color}40`, background: `${badge.color}12`, color: badge.color }}>
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ animation: isVisible ? 'fadeUp 0.9s ease 0.2s both' : 'none' }}>
            <EngagementSimulation isDark={isDark} ui={ui} />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('engagementPage.features.badge', 'المميزات')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t('engagementPage.features.title', 'كل ما تحتاجه لفهم تفاعل جمهورك')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: ui.muted, margin: '0 auto', maxWidth: '520px' }}>
              {t('engagementPage.features.subtitle', 'من منشور واحد إلى صورة شاملة عن أداء علامتك التجارية')}
            </p>
          </div>

          <div className="eng-features-grid">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={f.title}
                  style={{ borderRadius: '20px', padding: '1.5rem', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative', overflow: 'hidden', transition: 'all 0.25s', animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '60'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${f.color}15` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border;      e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = 'none' }}
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

        {/* ── HOW IT WORKS ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(to left, ${ACCENT}, #EC4899, #C9A84C)` }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('engagementPage.howItWorks.title', 'كيف تعمل خاصية التفاعل؟')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('engagementPage.howItWorks.subtitle', 'ثلاث خطوات من الرصد إلى التقرير')}
            </p>
          </div>
          <div className="eng-steps-grid">
            {STEPS.map(s => (
              <div key={s.num} style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '18px', background: s.accent + '15', border: `1px solid ${s.accent}30`, color: s.accent, fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem' }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: ui.text, margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: ui.muted, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── METRICS SHOWCASE ── */}
        <section style={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(to left, #EC4899, ${ACCENT}, #4A90D9)` }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: ui.border }}>
            {[
              { value: '+12M', label: t('engagementPage.metrics.interactions', 'تفاعل محلّل'),    sub: t('engagementPage.metrics.interactionsSub', 'إعجابات، تعليقات، مشاركات'),  color: '#EC4899', Icon: Heart     },
              { value: '97%',  label: t('engagementPage.metrics.realtime',     'تحديث فوري'),      sub: t('engagementPage.metrics.realtimeSub',     'بدون تأخير في البيانات'),     color: ACCENT,    Icon: Zap       },
              { value: '4',    label: t('engagementPage.metrics.platforms',    'منصات مدعومة'),    sub: 'Facebook · Instagram · TikTok · YouTube',                           color: '#4A90D9', Icon: BarChart2 },
              { value: '∞',    label: t('engagementPage.metrics.history',      'تاريخ المنشورات'), sub: t('engagementPage.metrics.historySub',      'بلا حدود زمنية'),             color: '#2E8B57', Icon: TrendingUp},
            ].map((stat, i) => {
              const Icon = stat.Icon
              return (
                <div key={stat.label}
                  style={{ padding: '2rem 1.5rem', textAlign: 'center', background: ui.surface, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? '#161616' : '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = ui.surface}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: stat.color + '15', border: `1px solid ${stat.color}25`, marginBottom: '0.75rem' }}>
                    <Icon size={18} color={stat.color} />
                  </div>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: stat.color, margin: '0 0 4px', lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: '0.78rem', color: ui.text, margin: '0 0 3px', fontWeight: 700 }}>{stat.label}</p>
                  <p style={{ fontSize: '0.68rem', color: ui.muted, margin: 0 }}>{stat.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ borderRadius: '24px', background: isDark ? `linear-gradient(135deg, ${ACCENT}12, #EC489908)` : `linear-gradient(135deg, ${ACCENT}08, #EC489905)`, border: `1px solid ${ACCENT}30`, padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: `${ACCENT}08`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: '#EC489908', pointerEvents: 'none' }} />

          <div style={{ position: 'relative' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '1.25rem', border: `1px solid ${ACCENT}40`, background: `${ACCENT}14`, color: ACCENT, fontSize: '0.75rem', fontWeight: 700 }}>
              <BarChart2 size={12} />
              {t('engagementPage.cta.badge', 'جرّب التحليل مجاناً')}
            </span>
            <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.9rem)', fontWeight: 900, color: ui.text, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
              {t('engagementPage.cta.title', 'ابدأ قياس تفاعل جمهورك اليوم')}
            </h2>
            <p style={{ fontSize: '0.95rem', color: ui.muted, margin: '0 auto 2rem', maxWidth: '500px', lineHeight: 1.7 }}>
              {t('engagementPage.cta.description', 'احصل على صورة كاملة عن أداء علامتك التجارية عبر منصات التواصل الاجتماعي مع تقارير قابلة للتصدير.')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <NavLink to="/request-access"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', borderRadius: '12px', padding: '13px 32px', fontSize: '0.93rem', fontWeight: 700, background: ACCENT, color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: `0 4px 20px ${ACCENT}40` }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = ACCENT;    e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {t('home.requestTrial', 'اطلب وصولاً تجريبياً')}
                <ArrowRight size={16} />
              </NavLink>
              <NavLink to="/contact-us"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '13px 28px', fontSize: '0.93rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
              >
                {t('footer.contactUs', 'تواصل معنا')}
              </NavLink>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}