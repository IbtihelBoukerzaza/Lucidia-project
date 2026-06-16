import { NavLink, useNavigate } from 'react-router-dom'
import {
  ThumbsUp, ThumbsDown, Minus, Activity, Hash, Bell,
  BarChart2, Brain, Zap, Globe, Shield, ChevronDown,
  Menu, X, Radio, Camera, Play, ArrowLeft, Check,
  TrendingUp, Target, Cpu, Users,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo (2).png'

// ─── Fake data for simulation ─────────────────────────────────────────────────

const LIVE_POSTS = [
  { platform: 'facebook',  text: 'موبيليس شبكة ممتازة وخدمة العملاء رائعة جداً 👍',          sentiment: 'positive', score: 94 },
  { platform: 'instagram', text: 'الإنترنت بطيء هذه الأيام من اتصالات الجزائر 😞',           sentiment: 'negative', score: 12 },
  { platform: 'tiktok',    text: 'عروض جيدة من جيزي هذا الشهر بصراحة',                       sentiment: 'positive', score: 81 },
  { platform: 'facebook',  text: 'خدمة موبيليس عادية لا هي ممتازة ولا سيئة',                 sentiment: 'neutral',  score: 52 },
  { platform: 'instagram', text: 'اتصالات الجزائر تحسنت كثيراً في الفترة الأخيرة 🔥',         sentiment: 'positive', score: 88 },
  { platform: 'tiktok',    text: 'فاتورة جيزي غالية جداً مقارنة بالخدمة المقدمة 😤',         sentiment: 'negative', score: 8  },
  { platform: 'facebook',  text: 'سرعة النت مقبولة لكن الشبكة تنقطع أحياناً',                sentiment: 'neutral',  score: 49 },
  { platform: 'instagram', text: 'موبيليس الأفضل في الجزائر بدون منازع 💯',                  sentiment: 'positive', score: 97 },
]

const PLATFORM_CFG = {
  facebook:  { color: '#4F46E5', icon: Radio  },
  instagram: { color: '#EC4899', icon: Camera },
  tiktok:    { color: '#14B8A6', icon: Play   },
}

const SENTIMENT_CFG = {
  positive: { label: 'إيجابي', color: '#2E8B57', bg: '#2E8B5715', border: '#2E8B5730', icon: ThumbsUp   },
  negative: { label: 'سلبي',   color: '#E53E3E', bg: '#E53E3E15', border: '#E53E3E30', icon: ThumbsDown },
  neutral:  { label: 'محايد',  color: '#C9A84C', bg: '#C9A84C15', border: '#C9A84C30', icon: Minus      },
}

const WEEK_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

const INITIAL_BARS = [
  { pos: 62, neg: 18, neu: 20 },
  { pos: 70, neg: 12, neu: 18 },
  { pos: 55, neg: 25, neu: 20 },
  { pos: 78, neg: 10, neu: 12 },
  { pos: 65, neg: 20, neu: 15 },
  { pos: 82, neg: 8,  neu: 10 },
  { pos: 74, neg: 14, neu: 12 },
]

// ─── Sentiment Simulation Component ──────────────────────────────────────────

function SentimentSimulation({ isDark }) {
  const [posts,     setPosts]    = useState([])
  const [bars,      setBars]     = useState(INITIAL_BARS)
  const [activeDay, setActiveDay] = useState(6)
  const [score,     setScore]    = useState(74)
  const postIndex = useRef(0)

  useEffect(() => {
    const addPost = () => {
      const post = LIVE_POSTS[postIndex.current % LIVE_POSTS.length]
      postIndex.current += 1
      setPosts(prev => [{ ...post, id: Date.now() + Math.random() }, ...prev].slice(0, 5))
      setScore(prev => {
        const delta = post.sentiment === 'positive' ? 2 : post.sentiment === 'negative' ? -2 : 0
        return Math.min(99, Math.max(1, prev + delta))
      })
    }
    addPost()
    const id = setInterval(addPost, 2400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setActiveDay(d => (d + 1) % 7)
      setBars(prev => prev.map(b => ({
        pos: Math.min(95, Math.max(30, b.pos + (Math.random() * 14 - 7))),
        neg: Math.min(40, Math.max(5,  b.neg + (Math.random() * 8  - 4))),
        neu: Math.min(40, Math.max(5,  b.neu + (Math.random() * 6  - 3))),
      })))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const scoreColor = score >= 70 ? '#2E8B57' : score >= 40 ? '#C9A84C' : '#E53E3E'
  const scoreLabel = score >= 70 ? 'إيجابي' : score >= 40 ? 'محايد' : 'سلبي'

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
      {/* Title bar */}
      <div style={{ padding: '10px 18px', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, background: isDark ? '#111' : '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#E53E3E','#F59E0B','#2E8B57'].map(c => (
              <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <span style={{ fontSize: '0.7rem', color: isDark ? '#4B5563' : '#9CA3AF', fontWeight: 600 }}>
            Gantra — تحليل المشاعر
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', boxShadow: '0 0 6px #2E8B57', animation: 'livePulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.65rem', color: '#2E8B57', fontWeight: 700 }}>مباشر</span>
        </div>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Score gauge */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Circular score */}
          <div style={{ borderRadius: '14px', padding: '12px 16px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '90px', gap: '4px' }}>
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              <svg viewBox="0 0 56 56" style={{ width: '56px', height: '56px', transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r="22" fill="none" stroke={isDark ? '#1E1E1E' : '#E5E7EB'} strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke={scoreColor} strokeWidth="5"
                  strokeDasharray={`${(score / 100) * 138} 138`}
                  style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: scoreColor, transition: 'color 0.5s' }}>
                {Math.round(score)}%
              </div>
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: scoreColor, transition: 'color 0.5s' }}>{scoreLabel}</span>
            <span style={{ fontSize: '0.55rem', color: isDark ? '#4B5563' : '#9CA3AF', textAlign: 'center' }}>مؤشر المشاعر</span>
          </div>

          {/* Week chart */}
          <div style={{ flex: 1, borderRadius: '14px', padding: '10px 12px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}` }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', margin: '0 0 8px' }}>توزيع المشاعر — الأسبوع الحالي</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '52px' }}>
              {bars.map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
                  onClick={() => setActiveDay(i)}
                >
                  <div style={{ borderRadius: '3px 3px 0 0', background: '#2E8B57', height: `${b.pos * 0.52}px`, transition: 'height 0.8s ease', opacity: activeDay === i ? 1 : 0.55 }} />
                  <div style={{ background: '#C9A84C', height: `${b.neu * 0.52}px`, transition: 'height 0.8s ease', opacity: activeDay === i ? 1 : 0.55 }} />
                  <div style={{ borderRadius: '0 0 3px 3px', background: '#E53E3E', height: `${b.neg * 0.52}px`, transition: 'height 0.8s ease', opacity: activeDay === i ? 1 : 0.55 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {WEEK_DAYS.map((d, i) => (
                <span key={d} style={{ fontSize: '0.45rem', color: activeDay === i ? '#C9A84C' : (isDark ? '#374151' : '#D1D5DB'), fontWeight: activeDay === i ? 800 : 500, transition: 'color 0.3s' }}>{d.slice(0,3)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Live post feed */}
        <div style={{ borderRadius: '12px', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, overflow: 'hidden' }}>
          <div style={{ padding: '7px 12px', background: isDark ? '#161616' : '#F8FAFC', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={10} color="#C9A84C" />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF' }}>تصنيف المنشورات — مباشر</span>
          </div>
          {posts.slice(0, 4).map((post, i) => {
            const plt = PLATFORM_CFG[post.platform]
            const snt = SENTIMENT_CFG[post.sentiment]
            const PIcon = plt.icon
            const SIcon = snt.icon
            const barWidth = post.sentiment === 'positive' ? post.score : post.sentiment === 'negative' ? 100 - post.score : 50
            return (
              <div key={post.id} style={{ padding: '8px 12px', borderBottom: i < 3 ? `1px solid ${isDark ? '#1A1A1A' : '#F5F5F3'}` : 'none', animation: i === 0 ? 'slideIn 0.4s ease' : 'none', background: i === 0 ? (isDark ? '#C9A84C06' : '#C9A84C03') : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, background: plt.color + '15', border: `1px solid ${plt.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PIcon size={10} color={plt.color} />
                  </div>
                  <p style={{ fontSize: '0.63rem', lineHeight: 1.5, color: isDark ? '#9CA3AF' : '#374151', margin: 0, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {post.text}
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '5px', flexShrink: 0, background: snt.bg, border: `1px solid ${snt.border}`, color: snt.color, fontSize: '0.55rem', fontWeight: 700 }}>
                    <SIcon size={8} />{snt.label}
                  </span>
                </div>
                <div style={{ marginTop: '5px', marginRight: '29px', height: '3px', borderRadius: '99px', background: isDark ? '#1E1E1E' : '#F0F0F0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '99px', width: `${barWidth}%`, background: snt.color, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {Object.entries(SENTIMENT_CFG).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: v.color }} />
              <span style={{ fontSize: '0.58rem', color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: 600 }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Public Navbar (same as HomePage) ────────────────────────────────────────

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
    { icon: Activity,  label: t('navigation.socialListening', 'الرصد الاجتماعي'), path: '/products/social-listening', desc: t('home.products.socialListening.desc', 'رصد المنشورات عبر المنصات') },
    { icon: ThumbsUp,  label: t('navigation.sentiment',       'تحليل المشاعر'),   path: '/products/sentiment-analysis', desc: t('home.products.sentiment.desc', 'تحليل باللهجة الجزائرية والمغاربية') },
    { icon: Hash,      label: t('navigation.topics',          'المواضيع'),         path: '/products/topics', desc: t('home.products.topics.desc', 'اكتشاف الترندات تلقائياً') },
    { icon: Bell,      label: t('navigation.alerts',          'التنبيهات'),        path: '/products/alerts', desc: t('home.products.alerts.desc', 'تنبيهات عند ارتفاع المشاعر السلبية') },
    { icon: BarChart2, label: t('navigation.engagement',      'التفاعل'),          path: '/products/engagement', desc: t('home.products.engagement.desc', 'إحصاءات التفاعل والانتشار') },
  ]

  const nb = {
    bg:     isDark ? 'rgba(10,10,10,0.88)'  : 'rgba(248,250,252,0.92)',
    border: isDark ? '#1E1E1E' : '#E2E8F0',
    muted:  isDark ? '#6B7280' : '#64748B',
  }

  return (
    <>
      <style>{`
        .pub-nav-links-sa { display: flex; }
        .pub-nav-hamburger-sa { display: none !important; }
        @media (max-width: 860px) {
          .pub-nav-links-sa { display: none !important; }
          .pub-nav-hamburger-sa { display: flex !important; }
        }
      `}</style>
      <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, borderBottom: `1px solid ${nb.border}`, background: nb.bg, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={gantraLogo} alt="Gantra" style={{ height: '42px', filter: isDark ? 'none' : 'brightness(0.85)' }} />
          </NavLink>

          <div className="pub-nav-links-sa" style={{ alignItems: 'center', gap: '4px' }}>
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

            <button className="pub-nav-hamburger-sa" onClick={() => setMobileOpen(v => !v)}
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

export default function SentimentAnalysisPage() {
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
    {
      icon: ThumbsUp,
      color: '#2E8B57',
      title: t('sentimentAnalysis.features.dialectTitle', 'اللهجة الجزائرية والمغاربية'),
      desc:  t('sentimentAnalysis.features.dialectDesc',  'نماذج ذكاء اصطناعي متخصصة في فهم الدارجة الجزائرية والعربية المغاربية، تتجاوز حدود النماذج العالمية.'),
    },
    {
      icon: TrendingUp,
      color: '#4A90D9',
      title: t('sentimentAnalysis.features.realtimeTitle', 'تحليل في الوقت الفعلي'),
      desc:  t('sentimentAnalysis.features.realtimeDesc',  'كل منشور يُصنَّف تلقائياً فور جمعه — إيجابي أو سلبي أو محايد — دون أي تدخل يدوي.'),
    },
    {
      icon: BarChart2,
      color: '#C9A84C',
      title: t('sentimentAnalysis.features.chartsTitle', 'مخططات تفاعلية'),
      desc:  t('sentimentAnalysis.features.chartsDesc',  'تابع توزيع المشاعر يومياً وأسبوعياً عبر رسوم بيانية واضحة تظهر التحولات في رأي الجمهور.'),
    },
    {
      icon: Bell,
      color: '#E53E3E',
      title: t('sentimentAnalysis.features.alertsTitle', 'تنبيهات عند ارتفاع السلبية'),
      desc:  t('sentimentAnalysis.features.alertsDesc',  'يُرسِل النظام تنبيهاً فورياً حين تتجاوز المشاعر السلبية عتبة محددة لحماية سمعتك.'),
    },
    {
      icon: Target,
      color: '#8B5CF6',
      title: t('sentimentAnalysis.features.accuracyTitle', 'دقة مُثبتة'),
      desc:  t('sentimentAnalysis.features.accuracyDesc',  'دقة تصنيف 72٪ على بيانات اختبار حقيقية من منشورات جزائرية — مُقاسة وموثقة.'),
    },
    {
      icon: Shield,
      color: '#F59E0B',
      title: t('sentimentAnalysis.features.multiPlatformTitle', 'متعدد المنصات'),
      desc:  t('sentimentAnalysis.features.multiPlatformDesc',  'يعمل على منشورات Facebook وInstagram وTikTok وYouTube ضمن نفس الواجهة.'),
    },
  ]

  const STEPS = [
    {
      num: '01',
      accent: '#2E8B57',
      title: t('sentimentAnalysis.steps.step1Title', 'جمع المنشورات'),
      desc:  t('sentimentAnalysis.steps.step1Desc',  'تُجمع المنشورات الجديدة من المنصات المدعومة وتُدفع إلى خط معالجة النصوص.'),
    },
    {
      num: '02',
      accent: '#4A90D9',
      title: t('sentimentAnalysis.steps.step2Title', 'المعالجة اللغوية'),
      desc:  t('sentimentAnalysis.steps.step2Desc',  'يُنظَّف النص ويُعالَج بنموذج ذكاء اصطناعي مخصص للهجة الجزائرية والمغاربية.'),
    },
    {
      num: '03',
      accent: '#C9A84C',
      title: t('sentimentAnalysis.steps.step3Title', 'التصنيف والنتيجة'),
      desc:  t('sentimentAnalysis.steps.step3Desc',  'يُصنَّف كل منشور (إيجابي / سلبي / محايد) مع درجة ثقة، وتُحدَّث لوحة التحكم فوراً.'),
    },
  ]

  const WHY_ITEMS = [
    { label: t('sentimentAnalysis.why.dialect',  'لهجة جزائرية'), icon: '🇩🇿', color: '#2E8B57' },
    { label: t('sentimentAnalysis.why.realtime', 'تحليل فوري'),    icon: '⚡',  color: '#C9A84C' },
    { label: t('sentimentAnalysis.why.accurate', 'دقة مُثبتة'),    icon: '🎯',  color: '#4A90D9' },
    { label: t('sentimentAnalysis.why.alerts',   'تنبيهات ذكية'),  icon: '🔔',  color: '#E53E3E' },
    { label: t('sentimentAnalysis.why.charts',   'مخططات واضحة'),  icon: '📊',  color: '#8B5CF6' },
    { label: t('sentimentAnalysis.why.export',   'تقارير قابلة للتصدير'), icon: '📄', color: '#F59E0B' },
  ]

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes slideIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .sa-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .sa-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .sa-why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 900px) {
          .sa-hero-grid     { grid-template-columns: 1fr; }
          .sa-features-grid { grid-template-columns: repeat(2, 1fr); }
          .sa-why-grid      { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .sa-features-grid { grid-template-columns: 1fr; }
          .sa-why-grid      { grid-template-columns: 1fr; }
        }
      `}</style>

      <PublicNavbar ui={ui} isDark={isDark} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '6rem', paddingTop: '6rem', paddingBottom: '5rem' }}>

        {/* ── HERO ── */}
        <section
          className="sa-hero-grid"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', width: 'fit-content', border: '1px solid rgba(46,139,87,0.4)', background: 'rgba(46,139,87,0.08)', color: '#2E8B57', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', animation: 'pulse 2s infinite' }} />
              {t('sentimentAnalysis.hero.badge', 'تحليل المشاعر')}
            </span>

            <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 900, lineHeight: 1.2, margin: 0, color: ui.text, letterSpacing: '-0.02em' }}>
              {t('sentimentAnalysis.hero.titlePre', 'اعرف كيف يشعر')}{' '}
              <span style={{ background: 'linear-gradient(135deg, #2E8B57, #4A90D9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('sentimentAnalysis.hero.titleHighlight', 'جمهورك الجزائري')}
              </span>
              {' '}{t('sentimentAnalysis.hero.titleEnd', 'تجاه علامتك')}
            </h1>

            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: ui.muted, margin: 0, maxWidth: '480px' }}>
              {t('sentimentAnalysis.hero.description', 'نماذج ذكاء اصطناعي متخصصة في اللهجة الجزائرية والمغاربية تُصنِّف مشاعر جمهورك — إيجابي أو سلبي أو محايد — في الوقت الفعلي، عبر جميع المنصات المدعومة.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { text: t('sentimentAnalysis.hero.check1', 'دقة 72٪ على بيانات اختبار جزائرية حقيقية'), color: '#2E8B57' },
                { text: t('sentimentAnalysis.hero.check2', 'تحليل فوري لكل منشور جديد دون تدخل يدوي'),  color: '#4A90D9' },
                { text: t('sentimentAnalysis.hero.check3', 'تنبيهات ذكية عند ارتفاع المشاعر السلبية'), color: '#C9A84C' },
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
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, background: '#2E8B57', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(46,139,87,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3DAA6A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2E8B57'; e.currentTarget.style.transform = 'translateY(0)' }}
              >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

              <NavLink to="/"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
              >
                <ArrowLeft size={14} />
                {t('sentimentAnalysis.hero.backHome', 'الرئيسية')}
              </NavLink>
            </div>
          </div>

          <div style={{ animation: isVisible ? 'fadeUp 0.9s ease 0.2s both' : 'none' }}>
            <SentimentSimulation isDark={isDark} />
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to left, #4A90D9, #2E8B57, #C9A84C)' }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('sentimentAnalysis.steps.badge', 'كيف يعمل')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('sentimentAnalysis.steps.title', 'من المنشور إلى التصنيف في ثوانٍ')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('sentimentAnalysis.steps.subtitle', 'خط معالجة تلقائي بالكامل — لا حاجة لأي تدخل يدوي')}
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(46,139,87,0.35)', background: 'rgba(46,139,87,0.08)', color: '#2E8B57', fontSize: '0.75rem', fontWeight: 700 }}>
              <Brain size={12} />
              {t('sentimentAnalysis.features.badge', 'المزايا')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t('sentimentAnalysis.features.title', 'لماذا تحليل المشاعر من Gantra؟')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: ui.muted, margin: '0 auto', maxWidth: '520px' }}>
              {t('sentimentAnalysis.features.subtitle', 'مبني خصيصاً للسوق الجزائري بدقة لا تقدر عليها النماذج العالمية العامة')}
            </p>
          </div>

          <div className="sa-features-grid">
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

        {/* ── WHY GANTRA — pill tags ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface2, padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(74,144,217,0.35)', background: 'rgba(74,144,217,0.08)', color: '#4A90D9', fontSize: '0.75rem', fontWeight: 700 }}>
              <Cpu size={12} />
              {t('sentimentAnalysis.why.badge', 'ما يميّزنا')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('sentimentAnalysis.why.title', 'كل ما تحتاجه في منصة واحدة')}
            </h2>
          </div>
          <div className="sa-why-grid">
            {WHY_ITEMS.map(({ label, icon, color }) => (
              <div key={label}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px', padding: '1rem 1.25rem', border: `1px solid ${ui.border}`, background: ui.surface, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}12` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: ui.text }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── ACCURACY HIGHLIGHT ── */}
        <section style={{ borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(46,139,87,0.2)', background: isDark ? 'rgba(46,139,87,0.04)' : 'rgba(46,139,87,0.03)' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#2E8B57', opacity: 0.06, filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#4A90D9', opacity: 0.06, filter: 'blur(50px)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', position: 'relative' }}>
            {[
              { value: '72%',  label: t('sentimentAnalysis.stats.accuracy',  'دقة التصنيف'),             sub: t('sentimentAnalysis.stats.accuracySub',  'على بيانات اختبار حقيقية'), color: '#2E8B57', icon: Target },
              { value: '3428+', label: t('sentimentAnalysis.stats.posts',    'منشور مُدرَّب عليه'),       sub: t('sentimentAnalysis.stats.postsSub',    'من منصات جزائرية حقيقية'),  color: '#4A90D9', icon: Activity },
              { value: '4',    label: t('sentimentAnalysis.stats.platforms', 'منصات مدعومة'),             sub: t('sentimentAnalysis.stats.platformsSub', 'Facebook · Instagram · TikTok · YouTube'), color: '#C9A84C', icon: Globe },
              { value: '2+',   label: t('sentimentAnalysis.stats.dialects',  'لهجات مفهومة'),             sub: t('sentimentAnalysis.stats.dialectsSub',  'جزائرية · مغاربية · فصحى'), color: '#8B5CF6', icon: Cpu },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.label} style={{ padding: '1.5rem', borderRadius: '20px', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative', overflow: 'hidden', animation: `fadeUp 0.5s ease ${i * 0.1}s both`, transition: 'all 0.25s' }}
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
        <section style={{ borderRadius: '28px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(46,139,87,0.25)', background: isDark ? 'linear-gradient(135deg, rgba(46,139,87,0.08) 0%, rgba(74,144,217,0.08) 100%)' : 'linear-gradient(135deg, rgba(46,139,87,0.06) 0%, rgba(74,144,217,0.06) 100%)' }}>
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#2E8B57', opacity: 0.05, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#4A90D9', opacity: 0.05, filter: 'blur(60px)' }} />
          <img src={gantraLogo} alt="Gantra" style={{ height: '60px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {t('sentimentAnalysis.cta.title', 'جرّب تحليل المشاعر على بيانات علامتك')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: ui.muted, margin: '0 auto 2rem', maxWidth: '440px', lineHeight: 1.75 }}>
            {t('sentimentAnalysis.cta.description', 'راسلنا للحصول على وصول تجريبي وشاهد كيف تُصنَّف منشورات جمهورك الجزائري بدقة عالية.')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <NavLink to="/request-access"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '13px 32px', fontSize: '0.93rem', fontWeight: 700, background: '#2E8B57', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(46,139,87,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3DAA6A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2E8B57'; e.currentTarget.style.transform = 'translateY(0)' }}
            >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

            <NavLink to="/contact-us"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '13px 28px', fontSize: '0.93rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
            >{t('footer.contactUs', 'تواصل معنا')}</NavLink>
          </div>
        </section>

      </div>
    </div>
  )
}
