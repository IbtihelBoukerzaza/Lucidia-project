import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, Hash, Bell, BarChart2, Globe, Shield,
  ChevronDown, Menu, X, Radio, Camera, Play,
  ArrowLeft, Check, TrendingUp, Target, Search,
  ThumbsUp, ThumbsDown, Minus, Rss, Eye, Zap,
  Layers, Filter, RefreshCw,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo.png'

// ─── Simulation data ──────────────────────────────────────────────────────────

const INITIAL_KEYWORDS = [
  { word: 'موبيليس',        count: 312, sentiment: 'positive', category: 'علامات تجارية' },
  { word: 'الإنترنت',        count: 278, sentiment: 'negative', category: 'تقنية'         },
  { word: 'جيزي',            count: 251, sentiment: 'positive', category: 'علامات تجارية' },
  { word: 'شبكة',            count: 194, sentiment: 'negative', category: 'تقنية'         },
  { word: 'عروض',            count: 183, sentiment: 'positive', category: 'تسويق'         },
  { word: 'تطبيق',           count: 159, sentiment: 'neutral',  category: 'تقنية'         },
  { word: 'اتصالات الجزائر', count: 141, sentiment: 'neutral',  category: 'علامات تجارية' },
  { word: 'باقات',           count: 128, sentiment: 'positive', category: 'تسويق'         },
]

const HASHTAG_CLOUD = [
  { tag: '#موبيليس',         weight: 9, color: '#8B5CF6' },
  { tag: '#انترنت_الجزائر',  weight: 7, color: '#4A90D9' },
  { tag: '#جيزي',            weight: 8, color: '#2E8B57' },
  { tag: '#عروض_رمضان',      weight: 5, color: '#C9A84C' },
  { tag: '#اتصالات',         weight: 6, color: '#EC4899' },
  { tag: '#تطبيق_موبيليس',   weight: 4, color: '#8B5CF6' },
  { tag: '#شبكة_4G',         weight: 7, color: '#E53E3E' },
  { tag: '#باقات_انترنت',    weight: 5, color: '#14B8A6' },
  { tag: '#ترند_الجزائر',    weight: 6, color: '#F59E0B' },
  { tag: '#رصد_اجتماعي',     weight: 3, color: '#6366F1' },
]

const SENTIMENT_CFG = {
  positive: { label: 'إيجابي', color: '#2E8B57', icon: ThumbsUp   },
  negative: { label: 'سلبي',   color: '#E53E3E', icon: ThumbsDown },
  neutral:  { label: 'محايد',  color: '#C9A84C', icon: Minus      },
}

const CATEGORIES = ['الكل', 'علامات تجارية', 'تقنية', 'تسويق']

// ─── Topics Simulation ────────────────────────────────────────────────────────

function TopicsSimulation({ isDark }) {
  const [keywords, setKeywords]         = useState(INITIAL_KEYWORDS)
  const [activeCategory, setCategory]   = useState('الكل')
  const [newTopic, setNewTopic]         = useState(null)
  const [totalTopics, setTotalTopics]   = useState(47)
  const [tick, setTick]                 = useState(0)
  const tickRef = useRef(0)

  // fluctuate keyword counts
  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1
      setTick(tickRef.current)
      setKeywords(prev =>
        prev
          .map(k => ({
            ...k,
            count: Math.max(20, k.count + Math.floor(Math.random() * 18) - 7),
          }))
          .sort((a, b) => b.count - a.count)
      )
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // occasionally flash "new topic detected"
  useEffect(() => {
    const FLASHES = ['#خدمة_العملاء', '#تغطية_الشبكة', '#ترقيات_جيزي', '#مشاكل_الفاتورة']
    const id = setInterval(() => {
      setNewTopic(FLASHES[Math.floor(Math.random() * FLASHES.length)])
      setTotalTopics(n => n + 1)
      setTimeout(() => setNewTopic(null), 2800)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const filtered = activeCategory === 'الكل'
    ? keywords
    : keywords.filter(k => k.category === activeCategory)

  const maxCount = Math.max(...filtered.map(k => k.count), 1)

  return (
    <div style={{
      borderRadius: '24px',
      border: `1px solid ${isDark ? '#8B5CF622' : '#8B5CF644'}`,
      background: isDark ? '#0D0D0D' : '#FFFFFF',
      overflow: 'hidden',
      boxShadow: isDark
        ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px #8B5CF611'
        : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px #8B5CF622',
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
            Gantra — المواضيع الرائجة
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {newTopic && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#8B5CF6', background: '#8B5CF615', border: '1px solid #8B5CF630', borderRadius: '6px', padding: '2px 7px', animation: 'slideIn 0.3s ease' }}>
              ✦ موضوع جديد
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 6px #8B5CF6', animation: 'livePulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.65rem', color: '#8B5CF6', fontWeight: 700 }}>مباشر</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Totals + new topic flash */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <div style={{ flex: 1, borderRadius: '12px', padding: '10px 12px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#8B5CF6', margin: 0, lineHeight: 1 }}>{totalTopics}</p>
            <p style={{ fontSize: '0.58rem', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0, fontWeight: 600 }}>مواضيع مكتشفة</p>
          </div>
          <div style={{ flex: 1, borderRadius: '12px', padding: '10px 12px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#C9A84C', margin: 0, lineHeight: 1 }}>{keywords.reduce((a,k)=>a+k.count,0).toLocaleString()}</p>
            <p style={{ fontSize: '0.58rem', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0, fontWeight: 600 }}>إشارة مرصودة</p>
          </div>
          <div style={{ flex: 1, borderRadius: '12px', padding: '10px 12px', background: newTopic ? (isDark ? '#8B5CF615' : '#8B5CF608') : (isDark ? '#161616' : '#F8FAFC'), border: `1px solid ${newTopic ? '#8B5CF640' : (isDark ? '#1E1E1E' : '#F0F0EC')}`, display: 'flex', flexDirection: 'column', gap: '2px', transition: 'all 0.3s' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 900, color: newTopic ? '#8B5CF6' : (isDark ? '#374151' : '#D1D5DB'), margin: 0, lineHeight: 1.3, direction: 'rtl', transition: 'color 0.3s' }}>
              {newTopic || '—'}
            </p>
            <p style={{ fontSize: '0.55rem', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0, fontWeight: 600 }}>آخر موضوع</p>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ padding: '3px 10px', borderRadius: '8px', border: `1px solid ${activeCategory === cat ? '#8B5CF660' : (isDark ? '#2A2A2A' : '#E5E7EB')}`, background: activeCategory === cat ? '#8B5CF615' : 'transparent', color: activeCategory === cat ? '#8B5CF6' : (isDark ? '#6B7280' : '#9CA3AF'), fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            >{cat}</button>
          ))}
        </div>

        {/* Keyword frequency bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {filtered.slice(0, 6).map((kw, i) => {
            const snt = SENTIMENT_CFG[kw.sentiment]
            const SIcon = snt.icon
            const pct = Math.round((kw.count / maxCount) * 100)
            return (
              <div key={kw.word} style={{ animation: i === 0 && tick > 0 ? 'none' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#8B5CF6', minWidth: '16px', textAlign: 'center' }}>#{i+1}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isDark ? '#E5E7EB' : '#111', flex: 1 }}>{kw.word}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '1px 5px', borderRadius: '4px', background: snt.color + '15', color: snt.color, fontSize: '0.5rem', fontWeight: 700, flexShrink: 0 }}>
                    <SIcon size={7} />{snt.label}
                  </span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isDark ? '#9CA3AF' : '#6B7280', minWidth: '28px', textAlign: 'left' }}>{kw.count}</span>
                </div>
                <div style={{ height: '5px', borderRadius: '99px', background: isDark ? '#1E1E1E' : '#E5E7EB', overflow: 'hidden', marginRight: '22px' }}>
                  <div style={{ height: '100%', borderRadius: '99px', width: `${pct}%`, background: `linear-gradient(to left, #8B5CF6, #4A90D9)`, transition: 'width 1s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Hashtag cloud */}
        <div style={{ borderRadius: '10px', padding: '10px 12px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}` }}>
          <p style={{ fontSize: '0.58rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Hash size={9} />&nbsp;هاشتاقات رائجة
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', direction: 'rtl' }}>
            {HASHTAG_CLOUD.map(h => (
              <span key={h.tag}
                style={{
                  fontSize: `${0.5 + h.weight * 0.07}rem`,
                  fontWeight: h.weight >= 7 ? 900 : h.weight >= 5 ? 700 : 600,
                  color: h.color,
                  opacity: 0.75 + h.weight * 0.025,
                  cursor: 'default',
                  transition: 'all 0.5s ease',
                  lineHeight: 1.6,
                }}
              >{h.tag}</span>
            ))}
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
    { icon: Activity,   label: t('navigation.socialListening', 'الرصد الاجتماعي'), path: '/products/social-listening',   desc: t('home.products.socialListening.desc', 'رصد المنشورات عبر المنصات') },
    { icon: ThumbsUp,   label: t('navigation.sentiment',       'تحليل المشاعر'),   path: '/products/sentiment-analysis', desc: t('home.products.sentiment.desc', 'تحليل باللهجة الجزائرية والمغاربية') },
    { icon: Hash,       label: t('navigation.topics',          'المواضيع'),         path: '/products/topics',             desc: t('home.products.topics.desc', 'اكتشاف الترندات تلقائياً') },
    { icon: Bell,       label: t('navigation.alerts',          'التنبيهات'),        path: '/products/alerts',             desc: t('home.products.alerts.desc', 'تنبيهات عند ارتفاع المشاعر السلبية') },
    { icon: BarChart2,  label: t('navigation.engagement',      'التفاعل'),          path: '/products/engagement',         desc: t('home.products.engagement.desc', 'إحصاءات التفاعل والانتشار') },
  ]

  const nb = {
    bg:     isDark ? 'rgba(10,10,10,0.88)'  : 'rgba(248,250,252,0.92)',
    border: isDark ? '#1E1E1E' : '#E2E8F0',
    muted:  isDark ? '#6B7280' : '#64748B',
  }

  return (
    <>
      <style>{`
        .pub-nav-links-tp { display: flex; }
        .pub-nav-hamburger-tp { display: none !important; }
        @media (max-width: 860px) {
          .pub-nav-links-tp { display: none !important; }
          .pub-nav-hamburger-tp { display: flex !important; }
        }
      `}</style>
      <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, borderBottom: `1px solid ${nb.border}`, background: nb.bg, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={gantraLogo} alt="Gantra" style={{ height: '42px', filter: isDark ? 'none' : 'brightness(0.85)' }} />
          </NavLink>

          <div className="pub-nav-links-tp" style={{ alignItems: 'center', gap: '4px' }}>
            <div ref={productsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProductsOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '10px', border: 'none', background: productsOpen ? (isDark ? '#8B5CF614' : '#8B5CF610') : 'transparent', color: productsOpen ? '#8B5CF6' : nb.muted, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!productsOpen) e.currentTarget.style.color = '#8B5CF6' }}
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
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? '#8B5CF60D' : '#8B5CF608'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#8B5CF614', border: '1px solid #8B5CF625', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color="#8B5CF6" />
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
              onMouseEnter={e => e.currentTarget.style.color = '#8B5CF6'}
              onMouseLeave={e => e.currentTarget.style.color = nb.muted}
            >{t('home.nav.about', 'من نحن')}</NavLink>

            <NavLink to="/contact-us"
              style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: nb.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#8B5CF6'}
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

            <button className="pub-nav-hamburger-tp" onClick={() => setMobileOpen(v => !v)}
              style={{ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`, background: isDark ? '#1A1A1A' : '#F0F0EC', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${nb.border}`, background: isDark ? '#0A0A0A' : '#F8FAFC', padding: '12px 1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
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

export default function TopicsPage() {
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
      icon: TrendingUp,
      color: '#8B5CF6',
      title: t('topicsPage.features.autoDiscoverTitle', 'اكتشاف تلقائي للترندات'),
      desc:  t('topicsPage.features.autoDiscoverDesc',  'يكتشف النظام المواضيع الرائجة تلقائياً بعد كل عملية جمع، دون الحاجة لأي إعداد يدوي.'),
    },
    {
      icon: Hash,
      color: '#4A90D9',
      title: t('topicsPage.features.hashtagTitle', 'تتبع الهاشتاقات'),
      desc:  t('topicsPage.features.hashtagDesc',  'رصد الهاشتاقات المرتبطة بعلامتك وقياس انتشارها عبر المنصات المختلفة.'),
    },
    {
      icon: BarChart2,
      color: '#C9A84C',
      title: t('topicsPage.features.frequencyTitle', 'تحليل تكرار الكلمات'),
      desc:  t('topicsPage.features.frequencyDesc',  'يعدّ النظام تكرار كل كلمة ويرتبها تنازلياً لكشف ما يشغل جمهورك أكثر.'),
    },
    {
      icon: Filter,
      color: '#2E8B57',
      title: t('topicsPage.features.categoriesTitle', 'تصنيف حسب الفئة'),
      desc:  t('topicsPage.features.categoriesDesc',  'تُصنَّف المواضيع تلقائياً إلى فئات (علامات تجارية، تقنية، تسويق...) لسهولة الفلترة.'),
    },
    {
      icon: RefreshCw,
      color: '#E53E3E',
      title: t('topicsPage.features.realtimeTitle', 'تحديث في الوقت الفعلي'),
      desc:  t('topicsPage.features.realtimeDesc',  'قائمة الترندات تتحدث مع كل دورة جمع جديدة — ترى الصورة الحالية دائماً.'),
    },
    {
      icon: Layers,
      color: '#F59E0B',
      title: t('topicsPage.features.multiPlatformTitle', 'تحليل متعدد المنصات'),
      desc:  t('topicsPage.features.multiPlatformDesc',  'تُجمع الكلمات المفتاحية من Facebook وInstagram وTikTok وYouTube في قائمة موحّدة.'),
    },
  ]

  const STEPS = [
    {
      num: '01',
      accent: '#8B5CF6',
      title: t('topicsPage.steps.step1Title', 'جمع المنشورات'),
      desc:  t('topicsPage.steps.step1Desc',  'تُجمع منشورات علامتك من جميع المنصات وتُخزَّن في قاعدة البيانات.'),
    },
    {
      num: '02',
      accent: '#4A90D9',
      title: t('topicsPage.steps.step2Title', 'استخراج الكلمات المفتاحية'),
      desc:  t('topicsPage.steps.step2Desc',  'يحلّل النظام نصوص المنشورات ويستخرج الكلمات والهاشتاقات الأكثر تكراراً.'),
    },
    {
      num: '03',
      accent: '#C9A84C',
      title: t('topicsPage.steps.step3Title', 'عرض الترندات'),
      desc:  t('topicsPage.steps.step3Desc',  'تُعرض المواضيع مرتّبةً تنازلياً مع إحصاءات المشاعر والمنصات في لوحة التحكم.'),
    },
  ]

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes slideIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .tp-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .tp-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .tp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .tp-hero-grid     { grid-template-columns: 1fr; }
          .tp-features-grid { grid-template-columns: repeat(2, 1fr); }
          .tp-stats-grid    { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .tp-features-grid { grid-template-columns: 1fr; }
          .tp-stats-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <PublicNavbar ui={ui} isDark={isDark} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '6rem', paddingTop: '6rem', paddingBottom: '5rem' }}>

        {/* ── HERO ── */}
        <section
          className="tp-hero-grid"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', width: 'fit-content', border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6', animation: 'pulse 2s infinite' }} />
              {t('topicsPage.hero.badge', 'المواضيع')}
            </span>

            <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 900, lineHeight: 1.2, margin: 0, color: ui.text, letterSpacing: '-0.02em' }}>
              {t('topicsPage.hero.titlePre', 'اكتشف ما يتحدث عنه')}{' '}
              <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #4A90D9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('topicsPage.hero.titleHighlight', 'جمهورك الجزائري')}
              </span>
              {' '}{t('topicsPage.hero.titleEnd', 'لحظة بلحظة')}
            </h1>

            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: ui.muted, margin: 0, maxWidth: '480px' }}>
              {t('topicsPage.hero.description', 'يستخرج النظام الكلمات المفتاحية والهاشتاقات الأكثر تداولاً حول علامتك تلقائياً، ويرتّبها ترتيباً يكشف ما يشغل جمهورك أكثر من أي شيء آخر.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { text: t('topicsPage.hero.check1', 'اكتشاف تلقائي بعد كل عملية جمع — بلا تدخل يدوي'), color: '#8B5CF6' },
                { text: t('topicsPage.hero.check2', 'ترتيب ديناميكي للمواضيع حسب التكرار الفعلي'),       color: '#4A90D9' },
                { text: t('topicsPage.hero.check3', 'ربط كل موضوع بمشاعر الجمهور تلقائياً'),             color: '#C9A84C' },
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
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, background: '#8B5CF6', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#9D70F9'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(0)' }}
              >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

              <NavLink to="/"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
              >
                <ArrowLeft size={14} />
                {t('topicsPage.hero.backHome', 'الرئيسية')}
              </NavLink>
            </div>
          </div>

          <div style={{ animation: isVisible ? 'fadeUp 0.9s ease 0.2s both' : 'none' }}>
            <TopicsSimulation isDark={isDark} />
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to left, #C9A84C, #4A90D9, #8B5CF6)' }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('topicsPage.steps.badge', 'كيف يعمل')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('topicsPage.steps.title', 'من المنشور إلى الترند في ثلاث خطوات')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('topicsPage.steps.subtitle', 'العملية بالكامل تلقائية — النتائج تظهر في لوحة التحكم فور الانتهاء')}
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontSize: '0.75rem', fontWeight: 700 }}>
              <Zap size={12} />
              {t('topicsPage.features.badge', 'المزايا')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t('topicsPage.features.title', 'لماذا تحليل المواضيع من Gantra؟')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: ui.muted, margin: '0 auto', maxWidth: '520px' }}>
              {t('topicsPage.features.subtitle', 'اعرف بالضبط ما الذي يستأثر باهتمام جمهورك الجزائري')}
            </p>
          </div>

          <div className="tp-features-grid">
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
        <section style={{ borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.2)', background: isDark ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.03)' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#8B5CF6', opacity: 0.06, filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#4A90D9', opacity: 0.06, filter: 'blur(50px)' }} />

          <div className="tp-stats-grid" style={{ position: 'relative' }}>
            {[
              { value: '47+',   label: t('topicsPage.stats.topics',    'موضوع مكتشف'),                   sub: t('topicsPage.stats.topicsSub', 'في آخر دورة جمع'),                     color: '#8B5CF6', icon: Hash      },
              { value: '3428+', label: t('topicsPage.stats.posts',     'منشور مُحلَّل'),                 sub: t('topicsPage.stats.postsSub',  'من منصات جزائرية حقيقية'),             color: '#4A90D9', icon: Rss       },
              { value: '4',     label: t('topicsPage.stats.platforms', 'منصات مرصودة'),                  sub: t('topicsPage.stats.platformsSub', 'Facebook · Instagram · TikTok · YouTube'), color: '#C9A84C', icon: Globe     },
              { value: '∞',     label: t('topicsPage.stats.updates',  'تحديثات تلقائية'),                sub: t('topicsPage.stats.updatesSub', 'تتجدد مع كل عملية جمع'),              color: '#2E8B57', icon: RefreshCw },
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
        <section style={{ borderRadius: '28px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.25)', background: isDark ? 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(74,144,217,0.08) 100%)' : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(74,144,217,0.06) 100%)' }}>
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#8B5CF6', opacity: 0.05, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#4A90D9', opacity: 0.05, filter: 'blur(60px)' }} />
          <img src={gantraLogo} alt="Gantra" style={{ height: '60px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {t('topicsPage.cta.title', 'اكتشف ترندات علامتك التجارية اليوم')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: ui.muted, margin: '0 auto 2rem', maxWidth: '440px', lineHeight: 1.75 }}>
            {t('topicsPage.cta.description', 'راسلنا للحصول على وصول تجريبي وشاهد الكلمات والمواضيع التي يتحدث عنها جمهورك الجزائري.')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <NavLink to="/request-access"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '13px 32px', fontSize: '0.93rem', fontWeight: 700, background: '#8B5CF6', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#9D70F9'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(0)' }}
            >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

            <NavLink to="/contact-us"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '13px 28px', fontSize: '0.93rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
            >{t('footer.contactUs', 'تواصل معنا')}</NavLink>
          </div>
        </section>

      </div>
    </div>
  )
}
