import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, Hash, Bell, BarChart2, Globe, Shield,
  ChevronDown, Menu, X, Radio, Camera, Play,
  ArrowLeft, Check, TrendingUp, Target, Search,
  ThumbsUp, ThumbsDown, Minus, Rss, Eye, Zap,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo.png'

// ─── Simulation data ──────────────────────────────────────────────────────────

const BRANDS = ['موبيليس', 'جيزي', 'اتصالات الجزائر']

const LIVE_POSTS = [
  { platform: 'facebook',  text: 'موبيليس شبكة ممتازة وخدمة العملاء رائعة جداً 👍',          sentiment: 'positive' },
  { platform: 'instagram', text: 'الإنترنت بطيء هذه الأيام من اتصالات الجزائر 😞',           sentiment: 'negative' },
  { platform: 'tiktok',    text: 'عروض جيدة من جيزي هذا الشهر بصراحة',                       sentiment: 'positive' },
  { platform: 'facebook',  text: 'خدمة موبيليس عادية لا هي ممتازة ولا سيئة',                 sentiment: 'neutral'  },
  { platform: 'youtube',   text: 'شرحت تجربتي مع اتصالات الجزائر في هذا الفيديو 📹',          sentiment: 'neutral'  },
  { platform: 'tiktok',    text: 'فاتورة جيزي غالية جداً مقارنة بالخدمة المقدمة 😤',         sentiment: 'negative' },
  { platform: 'instagram', text: 'موبيليس الأفضل في الجزائر بدون منازع 💯',                  sentiment: 'positive' },
  { platform: 'facebook',  text: 'مشكلة في التغطية في منطقتنا منذ أسبوع 😡',                 sentiment: 'negative' },
  { platform: 'youtube',   text: 'مقارنة بين جيزي وموبيليس — أيهما أفضل؟',                  sentiment: 'neutral'  },
  { platform: 'tiktok',    text: 'تجديد الاشتراك سهل وسريع من تطبيق موبيليس',                sentiment: 'positive' },
  { platform: 'instagram', text: 'الدعم الفني لاتصالات الجزائر لا يرد على المكالمات',         sentiment: 'negative' },
  { platform: 'facebook',  text: 'باقات جيزي الجديدة مناسبة للجيب ومعقولة',                  sentiment: 'positive' },
]

const PLATFORM_CFG = {
  facebook:  { label: 'Facebook',  color: '#4F46E5', icon: Radio,  baseCount: 48 },
  instagram: { label: 'Instagram', color: '#EC4899', icon: Camera, baseCount: 31 },
  tiktok:    { label: 'TikTok',    color: '#14B8A6', icon: Play,   baseCount: 24 },
  youtube:   { label: 'YouTube',   color: '#E53E3E', icon: Eye,    baseCount: 15 },
}

const SENTIMENT_CFG = {
  positive: { label: 'إيجابي', color: '#2E8B57', bg: '#2E8B5715', border: '#2E8B5730', icon: ThumbsUp   },
  negative: { label: 'سلبي',   color: '#E53E3E', bg: '#E53E3E15', border: '#E53E3E30', icon: ThumbsDown },
  neutral:  { label: 'محايد',  color: '#C9A84C', bg: '#C9A84C15', border: '#C9A84C30', icon: Minus      },
}

// ─── Social Listening Simulation ─────────────────────────────────────────────

function SocialListeningSimulation({ isDark }) {
  const [posts,       setPosts]      = useState([])
  const [totalMentions, setTotal]    = useState(1247)
  const [counts,      setCounts]     = useState({ facebook: 48, instagram: 31, tiktok: 24, youtube: 15 })
  const [activeBrand, setActiveBrand] = useState(0)
  const [collecting,  setCollecting] = useState(true)
  const [lastCollect, setLastCollect] = useState('منذ لحظات')
  const postIndex = useRef(0)
  const secondsRef = useRef(0)

  useEffect(() => {
    const addPost = () => {
      const post = LIVE_POSTS[postIndex.current % LIVE_POSTS.length]
      postIndex.current += 1
      setPosts(prev => [{ ...post, id: Date.now() + Math.random(), brand: BRANDS[activeBrand] }, ...prev].slice(0, 6))
      setCounts(prev => ({ ...prev, [post.platform]: prev[post.platform] + 1 }))
      setTotal(prev => prev + Math.floor(Math.random() * 3) + 1)
    }
    addPost()
    const id = setInterval(addPost, 2200)
    return () => clearInterval(id)
  }, [activeBrand])

  useEffect(() => {
    const id = setInterval(() => {
      secondsRef.current += 1
      const s = secondsRef.current
      if (s < 60) setLastCollect(`منذ ${s} ثانية`)
      else setLastCollect(`منذ ${Math.floor(s / 60)} دقيقة`)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setActiveBrand(b => (b + 1) % BRANDS.length), 6000)
    return () => clearInterval(id)
  }, [])

  const totalPlatform = Object.values(counts).reduce((a, b) => a + b, 0) || 1

  return (
    <div style={{
      borderRadius: '24px',
      border: `1px solid ${isDark ? '#4A90D922' : '#4A90D944'}`,
      background: isDark ? '#0D0D0D' : '#FFFFFF',
      overflow: 'hidden',
      boxShadow: isDark
        ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px #4A90D911'
        : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px #4A90D922',
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
            Gantra — الرصد الاجتماعي
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4A90D9', boxShadow: '0 0 6px #4A90D9', animation: 'livePulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.65rem', color: '#4A90D9', fontWeight: 700 }}>يجمع</span>
        </div>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Brand selector + counter */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Brand pill + total */}
          <div style={{ borderRadius: '14px', padding: '10px 14px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '110px', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.55rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', margin: 0 }}>العلامة المرصودة</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#4A90D9', transition: 'all 0.4s' }}>{BRANDS[activeBrand]}</span>
            </div>
            <div style={{ width: '100%', height: '1px', background: isDark ? '#1E1E1E' : '#E5E7EB' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4A90D9', margin: 0, lineHeight: 1 }}>{totalMentions.toLocaleString()}</p>
            <p style={{ fontSize: '0.55rem', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0 }}>إجمالي الإشارات</p>
          </div>

          {/* Platform breakdown */}
          <div style={{ flex: 1, borderRadius: '14px', padding: '10px 12px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}` }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', margin: '0 0 8px' }}>توزيع المصادر</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {Object.entries(PLATFORM_CFG).map(([key, plt]) => {
                const Icon = plt.icon
                const pct = Math.round((counts[key] / totalPlatform) * 100)
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '5px', background: plt.color + '20', border: `1px solid ${plt.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={8} color={plt.color} />
                    </div>
                    <div style={{ flex: 1, height: '5px', borderRadius: '99px', background: isDark ? '#1E1E1E' : '#E5E7EB', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '99px', width: `${pct}%`, background: plt.color, transition: 'width 0.8s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: plt.color, minWidth: '26px', textAlign: 'left' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Live collection feed */}
        <div style={{ borderRadius: '12px', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, overflow: 'hidden' }}>
          <div style={{ padding: '7px 12px', background: isDark ? '#161616' : '#F8FAFC', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Rss size={10} color="#4A90D9" />
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF' }}>المنشورات المُجمَّعة — مباشر</span>
            </div>
            <span style={{ fontSize: '0.55rem', color: isDark ? '#374151' : '#D1D5DB' }}>{lastCollect}</span>
          </div>
          {posts.slice(0, 5).map((post, i) => {
            const plt = PLATFORM_CFG[post.platform]
            const snt = SENTIMENT_CFG[post.sentiment]
            const PIcon = plt.icon
            const SIcon = snt.icon
            return (
              <div key={post.id} style={{ padding: '8px 12px', borderBottom: i < 4 ? `1px solid ${isDark ? '#1A1A1A' : '#F5F5F3'}` : 'none', animation: i === 0 ? 'slideIn 0.4s ease' : 'none', background: i === 0 ? (isDark ? '#4A90D908' : '#4A90D904') : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, background: plt.color + '15', border: `1px solid ${plt.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PIcon size={10} color={plt.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.55rem', color: plt.color, fontWeight: 700, margin: '0 0 2px' }}>{plt.label}</p>
                    <p style={{ fontSize: '0.63rem', lineHeight: 1.45, color: isDark ? '#9CA3AF' : '#374151', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {post.text}
                    </p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '5px', flexShrink: 0, background: snt.bg, border: `1px solid ${snt.border}`, color: snt.color, fontSize: '0.52rem', fontWeight: 700 }}>
                    <SIcon size={7} />{snt.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Platform count pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(PLATFORM_CFG).map(([key, plt]) => {
            const Icon = plt.icon
            return (
              <div key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '8px', background: plt.color + '12', border: `1px solid ${plt.color}28` }}>
                <Icon size={9} color={plt.color} />
                <span style={{ fontSize: '0.58rem', fontWeight: 700, color: plt.color }}>{counts[key]}</span>
              </div>
            )
          })}
          <div style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '8px', background: '#2E8B5712', border: '1px solid #2E8B5728' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2E8B57', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#2E8B57' }}>جمع نشط</span>
          </div>
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
    { icon: Activity,  label: t('navigation.socialListening', 'الرصد الاجتماعي'), path: '/products/social-listening',   desc: t('home.products.socialListening.desc', 'رصد المنشورات عبر المنصات') },
    { icon: ThumbsUp,  label: t('navigation.sentiment',       'تحليل المشاعر'),   path: '/products/sentiment-analysis', desc: t('home.products.sentiment.desc', 'تحليل باللهجة الجزائرية والمغاربية') },
    { icon: Hash,      label: t('navigation.topics',          'المواضيع'),         path: '/products/topics',             desc: t('home.products.topics.desc', 'اكتشاف الترندات تلقائياً') },
    { icon: Bell,      label: t('navigation.alerts',          'التنبيهات'),        path: '/products/alerts',             desc: t('home.products.alerts.desc', 'تنبيهات عند ارتفاع المشاعر السلبية') },
    { icon: BarChart2, label: t('navigation.engagement',      'التفاعل'),          path: '/products/engagement',         desc: t('home.products.engagement.desc', 'إحصاءات التفاعل والانتشار') },
  ]

  const nb = {
    bg:     isDark ? 'rgba(10,10,10,0.88)'  : 'rgba(248,250,252,0.92)',
    border: isDark ? '#1E1E1E' : '#E2E8F0',
    muted:  isDark ? '#6B7280' : '#64748B',
  }

  return (
    <>
      <style>{`
        .pub-nav-links-sl { display: flex; }
        .pub-nav-hamburger-sl { display: none !important; }
        @media (max-width: 860px) {
          .pub-nav-links-sl { display: none !important; }
          .pub-nav-hamburger-sl { display: flex !important; }
        }
      `}</style>
      <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, borderBottom: `1px solid ${nb.border}`, background: nb.bg, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={gantraLogo} alt="Gantra" style={{ height: '42px', filter: isDark ? 'none' : 'brightness(0.85)' }} />
          </NavLink>

          <div className="pub-nav-links-sl" style={{ alignItems: 'center', gap: '4px' }}>
            <div ref={productsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProductsOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '10px', border: 'none', background: productsOpen ? (isDark ? '#4A90D914' : '#4A90D910') : 'transparent', color: productsOpen ? '#4A90D9' : nb.muted, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!productsOpen) e.currentTarget.style.color = '#4A90D9' }}
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
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? '#4A90D90D' : '#4A90D908'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#4A90D914', border: '1px solid #4A90D925', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color="#4A90D9" />
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
              onMouseEnter={e => e.currentTarget.style.color = '#4A90D9'}
              onMouseLeave={e => e.currentTarget.style.color = nb.muted}
            >{t('home.nav.about', 'من نحن')}</NavLink>

            <NavLink to="/contact-us"
              style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: nb.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4A90D9'}
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

            <button className="pub-nav-hamburger-sl" onClick={() => setMobileOpen(v => !v)}
              style={{ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`, background: isDark ? '#1A1A1A' : '#F0F0EC', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${nb.border}`, background: isDark ? '#0A0A0A' : '#F8FAFC', padding: '12px 1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4A90D9', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
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

export default function SocialListeningPage() {
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
      icon: Rss,
      color: '#4A90D9',
      title: t('socialListening.features.autoCollectTitle', 'جمع تلقائي ومستمر'),
      desc:  t('socialListening.features.autoCollectDesc',  'تُجمع المنشورات تلقائياً من جميع المنصات المدعومة دون أي تدخل يدوي — تعمل على مدار الساعة.'),
    },
    {
      icon: Globe,
      color: '#2E8B57',
      title: t('socialListening.features.multiPlatformTitle', 'أربع منصات في واجهة واحدة'),
      desc:  t('socialListening.features.multiPlatformDesc',  'Facebook وInstagram وTikTok وYouTube — كل منصة مراقَبة في نفس الوقت، نتائجها في مكان واحد.'),
    },
    {
      icon: Search,
      color: '#C9A84C',
      title: t('socialListening.features.keywordTitle', 'رصد بالكلمات المفتاحية'),
      desc:  t('socialListening.features.keywordDesc',  'حدّد علامتك التجارية أو منافسيك أو أي كلمة مفتاحية وسيرصد النظام كل إشارة تتعلق بها.'),
    },
    {
      icon: Activity,
      color: '#E53E3E',
      title: t('socialListening.features.realtimeTitle', 'بيانات في الوقت الفعلي'),
      desc:  t('socialListening.features.realtimeDesc',  'كل منشور جديد يُرصَد ويُضاف إلى لوحة التحكم فور نشره، بلا تأخير.'),
    },
    {
      icon: TrendingUp,
      color: '#8B5CF6',
      title: t('socialListening.features.trendsTitle', 'اكتشاف الترندات'),
      desc:  t('socialListening.features.trendsDesc',  'تعرّف على المواضيع والكلمات الأكثر تداولاً حول علامتك لحظة بلحظة.'),
    },
    {
      icon: Shield,
      color: '#F59E0B',
      title: t('socialListening.features.reputationTitle', 'حماية السمعة'),
      desc:  t('socialListening.features.reputationDesc',  'اكتشف الأزمات مبكراً قبل أن تنتشر — رصد المشاعر السلبية الحادة يصلك فورياً.'),
    },
  ]

  const STEPS = [
    {
      num: '01',
      accent: '#4A90D9',
      title: t('socialListening.steps.step1Title', 'أضف علامتك التجارية'),
      desc:  t('socialListening.steps.step1Desc',  'أدخل اسم علامتك التجارية أو الكلمات المفتاحية التي تريد رصدها عبر المنصات.'),
    },
    {
      num: '02',
      accent: '#2E8B57',
      title: t('socialListening.steps.step2Title', 'يبدأ الجمع التلقائي'),
      desc:  t('socialListening.steps.step2Desc',  'يُفعَّل نظام الرصد تلقائياً ويبدأ في جمع المنشورات من Facebook وInstagram وTikTok وYouTube.'),
    },
    {
      num: '03',
      accent: '#C9A84C',
      title: t('socialListening.steps.step3Title', 'تابع النتائج مباشرة'),
      desc:  t('socialListening.steps.step3Desc',  'اعرض المنشورات المجمّعة مع تحليل المشاعر والإحصاءات في لوحة التحكم الموحّدة.'),
    },
  ]

  const PLATFORMS = [
    { name: 'Facebook',  color: '#4F46E5', icon: Radio,  stat: t('socialListening.platforms.facebook',  'منشورات ومجموعات عامة') },
    { name: 'Instagram', color: '#EC4899', icon: Camera, stat: t('socialListening.platforms.instagram', 'منشورات وتعليقات') },
    { name: 'TikTok',   color: '#14B8A6', icon: Play,   stat: t('socialListening.platforms.tiktok',   'فيديوهات وتعليقات') },
    { name: 'YouTube',  color: '#E53E3E', icon: Eye,    stat: t('socialListening.platforms.youtube',  'فيديوهات وتعليقات') },
  ]

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes slideIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .sl-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .sl-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .sl-platforms-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .sl-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .sl-hero-grid      { grid-template-columns: 1fr; }
          .sl-features-grid  { grid-template-columns: repeat(2, 1fr); }
          .sl-platforms-grid { grid-template-columns: repeat(2, 1fr); }
          .sl-stats-grid     { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .sl-features-grid  { grid-template-columns: 1fr; }
          .sl-platforms-grid { grid-template-columns: repeat(2, 1fr); }
          .sl-stats-grid     { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <PublicNavbar ui={ui} isDark={isDark} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '6rem', paddingTop: '6rem', paddingBottom: '5rem' }}>

        {/* ── HERO ── */}
        <section
          className="sl-hero-grid"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', width: 'fit-content', border: '1px solid rgba(74,144,217,0.4)', background: 'rgba(74,144,217,0.08)', color: '#4A90D9', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4A90D9', animation: 'pulse 2s infinite' }} />
              {t('socialListening.hero.badge', 'الرصد الاجتماعي')}
            </span>

            <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 900, lineHeight: 1.2, margin: 0, color: ui.text, letterSpacing: '-0.02em' }}>
              {t('socialListening.hero.titlePre', 'اعرف ما يُقال عن')}{' '}
              <span style={{ background: 'linear-gradient(135deg, #4A90D9, #2E8B57)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('socialListening.hero.titleHighlight', 'علامتك التجارية')}
              </span>
              {' '}{t('socialListening.hero.titleEnd', 'عبر كل المنصات')}
            </h1>

            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: ui.muted, margin: 0, maxWidth: '480px' }}>
              {t('socialListening.hero.description', 'نظام رصد تلقائي يجمع المنشورات من Facebook وInstagram وTikTok وYouTube في وقت واحد، ويعرض كل ما يُقال عن علامتك في لوحة تحكم موحّدة.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { text: t('socialListening.hero.check1', 'رصد 4 منصات في وقت واحد من مكان واحد'),         color: '#4A90D9' },
                { text: t('socialListening.hero.check2', 'جمع تلقائي بلا تدخل يدوي على مدار الساعة'),      color: '#2E8B57' },
                { text: t('socialListening.hero.check3', 'تحليل مشاعر فوري مع كل منشور مُجمَّع'),          color: '#C9A84C' },
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
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, background: '#4A90D9', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(74,144,217,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#5BA3EC'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#4A90D9'; e.currentTarget.style.transform = 'translateY(0)' }}
              >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

              <NavLink to="/"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4A90D9'; e.currentTarget.style.color = '#4A90D9' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
              >
                <ArrowLeft size={14} />
                {t('socialListening.hero.backHome', 'الرئيسية')}
              </NavLink>
            </div>
          </div>

          <div style={{ animation: isVisible ? 'fadeUp 0.9s ease 0.2s both' : 'none' }}>
            <SocialListeningSimulation isDark={isDark} />
          </div>
        </section>

        {/* ── SUPPORTED PLATFORMS ── */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(74,144,217,0.35)', background: 'rgba(74,144,217,0.08)', color: '#4A90D9', fontSize: '0.75rem', fontWeight: 700 }}>
              <Globe size={12} />
              {t('socialListening.platforms.badge', 'المنصات المدعومة')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('socialListening.platforms.title', 'أربع منصات — لوحة تحكم واحدة')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('socialListening.platforms.subtitle', 'لا حاجة للتنقل بين التطبيقات — كل ما يُنشر عنك في مكان واحد')}
            </p>
          </div>

          <div className="sl-platforms-grid">
            {PLATFORMS.map((p, i) => {
              const Icon = p.icon
              return (
                <div key={p.name}
                  style={{ borderRadius: '20px', padding: '1.5rem', border: `1px solid ${ui.border}`, background: ui.surface, textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.25s', animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = p.color + '60'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${p.color}18` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: p.color }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', background: p.color + '18', border: `1px solid ${p.color}30`, marginBottom: '0.75rem' }}>
                    <Icon size={22} color={p.color} />
                  </div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: ui.text, margin: '0 0 4px' }}>{p.name}</h3>
                  <p style={{ fontSize: '0.72rem', color: ui.muted, margin: 0 }}>{p.stat}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to left, #C9A84C, #2E8B57, #4A90D9)' }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('socialListening.steps.badge', 'كيف يعمل')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('socialListening.steps.title', 'ثلاث خطوات من الإعداد إلى النتائج')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('socialListening.steps.subtitle', 'يستغرق الإعداد دقائق — الرصد يبدأ فوراً')}
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(74,144,217,0.35)', background: 'rgba(74,144,217,0.08)', color: '#4A90D9', fontSize: '0.75rem', fontWeight: 700 }}>
              <Zap size={12} />
              {t('socialListening.features.badge', 'المزايا')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t('socialListening.features.title', 'لماذا الرصد الاجتماعي من Gantra؟')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: ui.muted, margin: '0 auto', maxWidth: '520px' }}>
              {t('socialListening.features.subtitle', 'رصد شامل مبني خصيصاً للسوق الجزائري والمغاربي')}
            </p>
          </div>

          <div className="sl-features-grid">
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
        <section style={{ borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(74,144,217,0.2)', background: isDark ? 'rgba(74,144,217,0.04)' : 'rgba(74,144,217,0.03)' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#4A90D9', opacity: 0.06, filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#2E8B57', opacity: 0.06, filter: 'blur(50px)' }} />

          <div className="sl-stats-grid" style={{ position: 'relative' }}>
            {[
              { value: '4',     label: t('socialListening.stats.platforms',    'منصات مرصودة'),              sub: t('socialListening.stats.platformsSub', 'Facebook · Instagram · TikTok · YouTube'), color: '#4A90D9', icon: Globe },
              { value: '3428+', label: t('socialListening.stats.posts',        'منشور مُجمَّع'),              sub: t('socialListening.stats.postsSub',    'بيانات حقيقية من السوق الجزائري'),          color: '#2E8B57', icon: Rss },
              { value: '24/7',  label: t('socialListening.stats.uptime',       'رصد مستمر'),                  sub: t('socialListening.stats.uptimeSub',   'الجمع يعمل على مدار الساعة'),               color: '#C9A84C', icon: Activity },
              { value: '72%',   label: t('socialListening.stats.accuracy',     'دقة تحليل المشاعر'),          sub: t('socialListening.stats.accuracySub', 'على بيانات اختبار جزائرية حقيقية'),          color: '#8B5CF6', icon: Target },
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
        <section style={{ borderRadius: '28px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(74,144,217,0.25)', background: isDark ? 'linear-gradient(135deg, rgba(74,144,217,0.08) 0%, rgba(46,139,87,0.08) 100%)' : 'linear-gradient(135deg, rgba(74,144,217,0.06) 0%, rgba(46,139,87,0.06) 100%)' }}>
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#4A90D9', opacity: 0.05, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#2E8B57', opacity: 0.05, filter: 'blur(60px)' }} />
          <img src={gantraLogo} alt="Gantra" style={{ height: '60px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {t('socialListening.cta.title', 'ابدأ رصد علامتك التجارية اليوم')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: ui.muted, margin: '0 auto 2rem', maxWidth: '440px', lineHeight: 1.75 }}>
            {t('socialListening.cta.description', 'راسلنا للحصول على وصول تجريبي وشاهد ما يُقال عن علامتك عبر المنصات الجزائرية في الوقت الفعلي.')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <NavLink to="/request-access"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '13px 32px', fontSize: '0.93rem', fontWeight: 700, background: '#4A90D9', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(74,144,217,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#5BA3EC'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4A90D9'; e.currentTarget.style.transform = 'translateY(0)' }}
            >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

            <NavLink to="/contact-us"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '13px 28px', fontSize: '0.93rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4A90D9'; e.currentTarget.style.color = '#4A90D9' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
            >{t('footer.contactUs', 'تواصل معنا')}</NavLink>
          </div>
        </section>

      </div>
    </div>
  )
}
