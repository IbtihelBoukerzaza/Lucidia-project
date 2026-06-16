import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, Hash, Bell, BarChart2, Globe, Shield,
  ChevronDown, Menu, X, Check, Zap,
  TrendingUp, Target, Users, Cpu, ThumbsUp,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo (2).png'

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
        .pub-nav-links-ab { display: flex; }
        .pub-nav-hamburger-ab { display: none !important; }
        @media (max-width: 860px) {
          .pub-nav-links-ab { display: none !important; }
          .pub-nav-hamburger-ab { display: flex !important; }
        }
      `}</style>
      <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, borderBottom: `1px solid ${nb.border}`, background: nb.bg, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={gantraLogo} alt="Gantra" style={{ height: '42px', filter: isDark ? 'none' : 'brightness(0.85)' }} />
          </NavLink>

          <div className="pub-nav-links-ab" style={{ alignItems: 'center', gap: '4px' }}>
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
              style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: '#C9A84C', textDecoration: 'none', background: isDark ? '#C9A84C10' : '#C9A84C0C' }}
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

            <button className="pub-nav-hamburger-ab" onClick={() => setMobileOpen(v => !v)}
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
              style={{ display: 'block', padding: '10px 0', borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F0F0EC'}`, fontSize: '0.84rem', fontWeight: 700, color: '#C9A84C', textDecoration: 'none' }}
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

export default function AboutPage() {
  const { t }           = useTranslation()
  const { currentLang } = useLanguage()
  const { theme }       = useTheme()
  const isDark          = theme === 'dark'
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => { setIsVisible(true) }, [])

  const ui = {
    bg:       isDark ? '#0A0A0A' : '#F8FAFC',
    surface:  isDark ? '#111111' : '#FFFFFF',
    surface2: isDark ? '#161616' : '#F1F5F9',
    border:   isDark ? '#1E1E1E' : '#E2E8F0',
    text:     isDark ? '#E5E7EB' : '#0F172A',
    muted:    isDark ? '#6B7280' : '#64748B',
    subtle:   isDark ? '#9CA3AF' : '#475569',
  }

  const PILLARS = [
    {
      icon: Cpu,
      color: '#C9A84C',
      title: t('aboutPage.pillars.dialectTitle', 'ذكاء اصطناعي للهجة الجزائرية'),
      desc:  t('aboutPage.pillars.dialectDesc',  'نماذج مدرّبة تحديداً على الدارجة الجزائرية والعربية المغاربية — لا نعتمد على نماذج عامة تفشل في فهم السياق المحلي.'),
    },
    {
      icon: Globe,
      color: '#4A90D9',
      title: t('aboutPage.pillars.platformsTitle', 'تغطية شاملة للمنصات'),
      desc:  t('aboutPage.pillars.platformsDesc',  'نرصد Facebook وInstagram وTikTok وYouTube ضمن نظام موحّد — كل ما يُقال عن علامتك في مكان واحد.'),
    },
    {
      icon: TrendingUp,
      color: '#2E8B57',
      title: t('aboutPage.pillars.realtimeTitle', 'بيانات فورية لا تاريخية'),
      desc:  t('aboutPage.pillars.realtimeDesc',  'البيانات تُجمَّع وتُحلَّل في الوقت الفعلي — تتخذ قراراتك بناءً على ما يحدث الآن، لا ما حدث الأسبوع الماضي.'),
    },
    {
      icon: Shield,
      color: '#8B5CF6',
      title: t('aboutPage.pillars.reputationTitle', 'حماية استباقية للسمعة'),
      desc:  t('aboutPage.pillars.reputationDesc',  'نظام تنبيهات ذكي يُنبّهك فور تجاوز مشاعر جمهورك عتبات محددة — الأزمات لا تبدأ دون إنذار مسبق.'),
    },
    {
      icon: Target,
      color: '#E53E3E',
      title: t('aboutPage.pillars.accuracyTitle', 'دقة مُقاسة وموثقة'),
      desc:  t('aboutPage.pillars.accuracyDesc',  'لا نكتفي بالادعاء — دقة تصنيف مُقاسة على بيانات اختبار حقيقية من منشورات جزائرية تُنشر علناً.'),
    },
    {
      icon: Activity,
      color: '#F59E0B',
      title: t('aboutPage.pillars.insightsTitle', 'تقارير قابلة للتصدير'),
      desc:  t('aboutPage.pillars.insightsDesc',  'ملخصات ذكية وتقارير دورية تُحوّل البيانات الخام إلى قرارات واضحة قابلة للمشاركة مع فريقك.'),
    },
  ]

  const VALUES = [
    { icon: '🇩🇿', color: '#C9A84C', title: t('aboutPage.values.local',       'جزائري أصيل'),    desc: t('aboutPage.values.localDesc',       'مبني في الجزائر، للجزائر — نفهم السوق المحلي لأننا جزء منه.') },
    { icon: '🎯',  color: '#4A90D9', title: t('aboutPage.values.precision',    'دقة لا تهاون'),   desc: t('aboutPage.values.precisionDesc',    'كل نتيجة مدعومة بمقاييس حقيقية — نحن لا نبيع وعوداً بلا أرقام.') },
    { icon: '⚡',  color: '#2E8B57', title: t('aboutPage.values.speed',        'سرعة التحديث'),   desc: t('aboutPage.values.speedDesc',        'بيانات متجددة باستمرار — الانتظار تكلفة لا نقبلها.') },
    { icon: '🔬',  color: '#8B5CF6', title: t('aboutPage.values.research',     'بحث مستمر'),      desc: t('aboutPage.values.researchDesc',     'نطوّر نماذجنا باستمرار بمزيد من البيانات الجزائرية الحقيقية.') },
  ]

  const PRODUCTS_LIST = [
    { icon: Activity,  color: '#4A90D9',  label: t('navigation.socialListening', 'الرصد الاجتماعي'), path: '/products/social-listening'   },
    { icon: ThumbsUp,  color: '#2E8B57',  label: t('navigation.sentiment',       'تحليل المشاعر'),   path: '/products/sentiment-analysis' },
    { icon: Hash,      color: '#8B5CF6',  label: t('navigation.topics',          'المواضيع'),         path: '/products/topics'             },
    { icon: Bell,      color: '#E53E3E',  label: t('navigation.alerts',          'التنبيهات'),        path: '/products/alerts'             },
    { icon: BarChart2, color: '#F59E0B',  label: t('navigation.engagement',      'التفاعل'),          path: '/products/engagement'         },
  ]

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .ab-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .ab-values-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .ab-story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .ab-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .ab-pillars-grid { grid-template-columns: repeat(2, 1fr); }
          .ab-values-grid  { grid-template-columns: 1fr; }
          .ab-story-grid   { grid-template-columns: 1fr; }
          .ab-stats-grid   { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .ab-pillars-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <PublicNavbar ui={ui} isDark={isDark} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '6rem', paddingTop: '6rem', paddingBottom: '5rem' }}>

        {/* ── HERO ── */}
        <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', paddingTop: '3rem', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 16px', borderRadius: '999px', border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C', animation: 'pulse 2s infinite' }} />
            {t('aboutPage.hero.badge', 'من نحن')}
          </span>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1.15, margin: 0, color: ui.text, letterSpacing: '-0.03em', maxWidth: '720px' }}>
            {t('aboutPage.hero.titlePre', 'منصة جزائرية مبنية')}{' '}
            <span style={{ background: 'linear-gradient(135deg, #C9A84C, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('aboutPage.hero.titleHighlight', 'للسوق الجزائري')}
            </span>
          </h1>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: ui.muted, margin: 0, maxWidth: '600px' }}>
            {t('aboutPage.hero.description', 'Gantra منصة متكاملة لرصد ما يُقال عن علامتك التجارية عبر مواقع التواصل الاجتماعي، مع تحليل المشاعر باللهجة الجزائرية والمغاربية — بيانات حقيقية، تحليل دقيق، قرارات مبنية على معطيات.')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <NavLink to="/request-access"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, background: '#C9A84C', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#D9B85A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.transform = 'translateY(0)' }}
            >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

            <NavLink to="/contact-us"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
            >{t('footer.contactUs', 'تواصل معنا')}</NavLink>
          </div>

          {/* Mini stat chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '0.5rem' }}>
            {[
              { value: '72%',  label: t('stats.accuracy',  'دقة التحليل'),          color: '#2E8B57' },
              { value: '4',    label: t('stats.platforms', 'منصات مرصودة'),          color: '#4A90D9' },
              { value: '7',    label: t('alertsPage.stats.ruleTypes', 'أنواع تنبيهات'), color: '#E53E3E' },
              { value: '🇩🇿',  label: t('aboutPage.hero.statAlgeria', 'صُنع في الجزائر'), color: '#C9A84C' },
            ].map(s => (
              <div key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 14px', borderRadius: '99px', border: `1px solid ${s.color}35`, background: s.color + '10' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: '0.7rem', color: ui.muted, fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── OUR STORY ── */}
        <section className="ab-story-grid" style={{ animation: 'fadeUp 0.7s ease 0.1s both' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', width: 'fit-content', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('aboutPage.story.badge', 'قصتنا')}
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, color: ui.text, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {t('aboutPage.story.title', 'وُلدنا من فراغ حقيقي في السوق الجزائري')}
            </h2>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.85, color: ui.muted, margin: 0 }}>
              {t('aboutPage.story.p1', 'لاحظنا أن الشركات الجزائرية تعتمد على أدوات غربية لا تفهم الدارجة الجزائرية ولا السياق الثقافي المحلي — فتحصل على نتائج مشوّهة أو تتجاهل تحليل المشاعر كلياً.')}
            </p>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.85, color: ui.muted, margin: 0 }}>
              {t('aboutPage.story.p2', 'قررنا بناء منصة من الصفر مدرّبة على اللهجة الجزائرية والمغاربية، مع رصد شامل لمنصات التواصل الاجتماعي الأكثر استخداماً في الجزائر.')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '0.25rem' }}>
              {[
                { text: t('home.about.point1', 'تحليل المشاعر باللهجة الجزائرية والمغاربية والعربية الفصحى'), color: '#C9A84C' },
                { text: t('home.about.point2', 'رصد المنشورات من Facebook وInstagram وTikTok وYouTube'),       color: '#4A90D9' },
                { text: t('home.about.point3', 'تقارير ذكية وتنبيهات فورية عند تغيّر المشاعر'),               color: '#2E8B57' },
                { text: t('home.about.point4', 'لوحة تحكم واضحة مع إحصاءات التفاعل والمواضيع الرائجة'),       color: '#8B5CF6' },
              ].map(({ text, color }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: color + '18', border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <Check size={11} color={color} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '0.83rem', color: ui.subtle, fontWeight: 500, lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card */}
          <div style={{ borderRadius: '24px', border: `1px solid ${isDark ? '#C9A84C22' : '#C9A84C44'}`, background: isDark ? '#0D0D0D' : '#FFFFFF', overflow: 'hidden', boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.5)' : '0 32px 80px rgba(0,0,0,0.1)', animation: 'floatY 6s ease-in-out infinite' }}>
            {/* Card header */}
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, background: isDark ? '#111' : '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['#E53E3E','#F59E0B','#2E8B57'].map(c => (
                  <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#C9A84C' }}>Gantra — لمحة عامة</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.6rem', color: '#2E8B57', fontWeight: 700 }}>مباشر</span>
              </div>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Platform header */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px', borderRadius: '14px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}` }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #C9A84C, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 900, color: ui.text, margin: 0 }}>Gantra · SentivyaDZ</p>
                  <p style={{ fontSize: '0.65rem', color: ui.muted, margin: 0 }}>Social Intelligence Platform</p>
                </div>
                <span style={{ marginRight: 'auto', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#2E8B5720', color: '#2E8B57', border: '1px solid #2E8B5730' }}>v2.0</span>
              </div>

              {/* Product list */}
              {PRODUCTS_LIST.map((p, i) => {
                const Icon = p.icon
                return (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '12px', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, background: isDark ? '#161616' : '#F8FAFC', animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: p.color + '18', border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color={p.color} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ui.text, flex: 1 }}>{p.label}</span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', opacity: 0.8 }} />
                  </div>
                )
              })}

              {/* Bottom stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                {[
                  { val: '72%', label: 'دقة التصنيف', color: '#2E8B57' },
                  { val: '4',   label: 'منصات',       color: '#4A90D9' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px', borderRadius: '12px', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, background: isDark ? '#161616' : '#F8FAFC', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.val}</p>
                    <p style={{ fontSize: '0.58rem', color: ui.muted, margin: '3px 0 0', fontWeight: 600 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT MAKES US DIFFERENT ── */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              <Zap size={12} />
              {t('aboutPage.pillars.badge', 'ما يميّزنا')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t('aboutPage.pillars.title', 'لماذا Gantra وليس غيرها؟')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: ui.muted, margin: '0 auto', maxWidth: '500px' }}>
              {t('aboutPage.pillars.subtitle', 'ستة ميّزات لا تجدها في أي منصة أخرى مبنية للسوق الجزائري')}
            </p>
          </div>

          <div className="ab-pillars-grid">
            {PILLARS.map((p, i) => {
              const Icon = p.icon
              return (
                <div key={p.title}
                  style={{ borderRadius: '20px', padding: '1.5rem', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative', overflow: 'hidden', transition: 'all 0.25s', animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = p.color + '60'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${p.color}15` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: p.color }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '13px', background: p.color + '18', border: `1px solid ${p.color}30`, color: p.color, marginBottom: '1rem' }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: ui.text, margin: '0 0 8px' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: ui.muted, margin: 0 }}>{p.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── OUR VALUES ── */}
        <section style={{ borderRadius: '28px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to left, #8B5CF6, #2E8B57, #4A90D9, #C9A84C)' }} />

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('aboutPage.values.badge', 'قيمنا')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 6px' }}>
              {t('aboutPage.values.title', 'المبادئ التي تقود كل قرار نتخذه')}
            </h2>
            <p style={{ fontSize: '0.84rem', color: ui.muted, margin: 0 }}>
              {t('aboutPage.values.subtitle', 'ليست شعارات على الحائط — هي ممارسات يومية تظهر في كل ميزة نبنيها')}
            </p>
          </div>

          <div className="ab-values-grid">
            {VALUES.map((v, i) => (
              <div key={v.title}
                style={{ borderRadius: '16px', padding: '1.25rem', border: `1px solid ${ui.border}`, background: isDark ? '#0A0A0A' : '#F8FAFC', display: 'flex', gap: '14px', alignItems: 'flex-start', transition: 'all 0.2s', animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = v.color + '50'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: v.color + '15', border: `1px solid ${v.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  {v.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: ui.text, margin: '0 0 6px' }}>{v.title}</h3>
                  <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: ui.muted, margin: 0 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={{ borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(201,168,76,0.2)', background: isDark ? 'rgba(201,168,76,0.04)' : 'rgba(201,168,76,0.03)' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#C9A84C', opacity: 0.07, filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#4A90D9', opacity: 0.06, filter: 'blur(50px)' }} />

          <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 6px' }}>
              {t('aboutPage.stats.title', 'بالأرقام')}
            </h2>
            <p style={{ fontSize: '0.84rem', color: ui.muted, margin: 0 }}>
              {t('aboutPage.stats.subtitle', 'مقاييس حقيقية لا تسويقية')}
            </p>
          </div>

          <div className="ab-stats-grid" style={{ position: 'relative' }}>
            {[
              { value: '72%',  label: t('stats.accuracy',              'دقة التحليل'),        sub: t('stats.accuracyNote', 'على بيانات الاختبار'),                          color: '#2E8B57', icon: Target    },
              { value: '4',    label: t('stats.platforms',             'منصات مدعومة'),       sub: t('stats.platformsNote', 'Facebook · Instagram · TikTok · YouTube'),     color: '#4A90D9', icon: Globe     },
              { value: '7',    label: t('alertsPage.stats.ruleTypes',  'أنواع تنبيهات'),      sub: t('alertsPage.stats.ruleTypesSub', 'تغطي كل سيناريوهات المراقبة'),        color: '#E53E3E', icon: Bell      },
              { value: '2+',   label: t('aboutPage.stats.dialects',   'لهجات مدعومة'),        sub: t('aboutPage.stats.dialectsSub',   'جزائرية، مغاربية، وعربية فصحى'),     color: '#C9A84C', icon: Users     },
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
                  <p style={{ fontSize: '0.68rem', color: ui.muted, margin: 0, lineHeight: 1.45 }}>{s.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── WHO WE SERVE ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              <Users size={12} />
              {t('whoWeServe.title', 'لمن تُفيد هذه المنصة؟')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 6px' }}>
              {t('aboutPage.serve.title', 'مبنية لكل من يهتم بسمعته الرقمية')}
            </h2>
            <p style={{ fontSize: '0.84rem', color: ui.muted, margin: 0 }}>
              {t('whoWeServe.description', 'أي جهة تريد معرفة ما يُقال عنها أو عن منافسيها على الإنترنت')}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {[
              { label: t('whoWeServe.localBrands',    'العلامات التجارية المحلية'), icon: '🏢', color: '#C9A84C' },
              { label: t('whoWeServe.smes',           'المؤسسات الصغيرة والمتوسطة'), icon: '🏬', color: '#4A90D9' },
              { label: t('whoWeServe.customerService','فرق خدمة العملاء'),            icon: '🎧', color: '#2E8B57' },
              { label: t('whoWeServe.agencies',       'وكالات التسويق الرقمي'),       icon: '📣', color: '#8B5CF6' },
              { label: t('whoWeServe.researchers',    'الباحثون والأكاديميون'),        icon: '🔬', color: '#E53E3E' },
            ].map(seg => (
              <div key={seg.label}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 16px', borderRadius: '14px', border: `1px solid ${ui.border}`, background: isDark ? '#0A0A0A' : '#F8FAFC', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = seg.color + '50'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ fontSize: '1.1rem' }}>{seg.icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: ui.subtle }}>{seg.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ borderRadius: '28px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(201,168,76,0.25)', background: isDark ? 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(74,144,217,0.08) 100%)' : 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(74,144,217,0.06) 100%)' }}>
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#C9A84C', opacity: 0.05, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#4A90D9', opacity: 0.05, filter: 'blur(60px)' }} />
          <img src={gantraLogo} alt="Gantra" style={{ height: '60px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {t('home.cta.title', 'هل تريد تجربة المنصة؟')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: ui.muted, margin: '0 auto 2rem', maxWidth: '440px', lineHeight: 1.75 }}>
            {t('home.cta.description', 'راسلنا للحصول على وصول تجريبي وتجربة المنصة على بيانات علامتك.')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <NavLink to="/request-access"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '13px 32px', fontSize: '0.93rem', fontWeight: 700, background: '#C9A84C', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#D9B85A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.transform = 'translateY(0)' }}
            >{t('home.requestTrial', 'اطلب وصولاً تجريبياً')}</NavLink>

            <NavLink to="/contact-us"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', borderRadius: '12px', padding: '13px 28px', fontSize: '0.93rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
            >{t('home.cta.contactUs', 'تواصل معنا')}</NavLink>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '1.5rem' }}>
            {[
              t('aboutPage.cta.chip1', 'بدون بطاقة ائتمان'),
              t('aboutPage.cta.chip2', 'إعداد في أقل من يوم'),
              t('aboutPage.cta.chip3', 'دعم بالعربية'),
            ].map(chip => (
              <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: ui.muted, padding: '4px 10px', borderRadius: '8px', border: `1px solid ${ui.border}`, background: isDark ? '#1A1A1A' : '#F8FAFC' }}>
                <Check size={10} color="#2E8B57" strokeWidth={3} /> {chip}
              </span>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
