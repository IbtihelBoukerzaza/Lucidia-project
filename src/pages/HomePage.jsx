import { NavLink, useNavigate } from 'react-router-dom'
import {
  Brain, Globe, Zap, Shield, Star,
  ChevronDown, Menu, X, Bell, BarChart2, Hash,
  ThumbsUp, ThumbsDown, Minus, Radio, Camera, Play,
  Activity, Users, Award, Building2, Cpu, ArrowLeft,
  MessageSquare, Target,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo (2).png'
import { api } from '../services/api'

// ─── Fake posts data ──────────────────────────────────────────────────────────

const FAKE_POSTS = [
  { platform: 'facebook',  text: 'موبيليس شبكة ممتازة وخدمة العملاء رائعة جداً 👍',           sentiment: 'positive' },
  { platform: 'instagram', text: 'الإنترنت بطيء هذه الأيام من اتصالات الجزائر 😞',            sentiment: 'negative' },
  { platform: 'tiktok',    text: 'عروض جيدة من جيزي هذا الشهر بصراحة',                        sentiment: 'positive' },
  { platform: 'facebook',  text: 'خدمة موبيليس عادية لا هي ممتازة ولا سيئة',                  sentiment: 'neutral'  },
  { platform: 'instagram', text: 'اتصالات الجزائر تحسنت كثيراً في الفترة الأخيرة 🔥',          sentiment: 'positive' },
  { platform: 'tiktok',    text: 'فاتورة جيزي غالية جداً مقارنة بالخدمة المقدمة 😤',          sentiment: 'negative' },
  { platform: 'facebook',  text: 'سرعة النت مقبولة لكن الشبكة تنقطع أحياناً',                 sentiment: 'neutral'  },
  { platform: 'instagram', text: 'موبيليس الأفضل في الجزائر بدون منازع 💯',                   sentiment: 'positive' },
  { platform: 'tiktok',    text: 'مشكلة في التغطية في منطقتنا منذ أسبوع 😡',                  sentiment: 'negative' },
  { platform: 'facebook',  text: 'باقات جيزي الجديدة مناسبة للجيب ومعقولة',                   sentiment: 'positive' },
  { platform: 'instagram', text: 'الدعم الفني لاتصالات الجزائر لا يرد على المكالمات',          sentiment: 'negative' },
  { platform: 'tiktok',    text: 'تجديد الاشتراك سهل وسريع من تطبيق موبيليس',                 sentiment: 'positive' },
]

const PLATFORM_CONFIG = {
  facebook:  { label: 'Facebook',  color: '#4F46E5', icon: Radio  },
  instagram: { label: 'Instagram', color: '#EC4899', icon: Camera },
  tiktok:    { label: 'TikTok',    color: '#14B8A6', icon: Play   },
}

const SENTIMENT_CONFIG = {
  positive: { label: 'إيجابي', color: '#2E8B57', bg: '#2E8B5715', border: '#2E8B5730', icon: ThumbsUp   },
  negative: { label: 'سلبي',   color: '#E53E3E', bg: '#E53E3E15', border: '#E53E3E30', icon: ThumbsDown },
  neutral:  { label: 'محايد',  color: '#C9A84C', bg: '#C9A84C15', border: '#C9A84C30', icon: Minus      },
}

// ─── Live Dashboard ───────────────────────────────────────────────────────────

function LiveDashboard({ isDark }) {
  const [posts,         setPosts]     = useState([])
  const [counts,        setCounts]    = useState({ positive: 0, negative: 0, neutral: 0 })
  const [totalMentions, setTotal]     = useState(1247)
  const [isRunning,     setIsRunning] = useState(true)
  const postIndex   = useRef(0)
  const intervalRef = useRef(null)

  const addPost = () => {
    const post = FAKE_POSTS[postIndex.current % FAKE_POSTS.length]
    postIndex.current += 1
    setPosts(prev => [{ ...post, id: Date.now() }, ...prev].slice(0, 6))
    setCounts(prev => ({ ...prev, [post.sentiment]: prev[post.sentiment] + 1 }))
    setTotal(prev => prev + Math.floor(Math.random() * 3) + 1)
  }

  useEffect(() => {
    if (isRunning) {
      addPost()
      intervalRef.current = setInterval(addPost, 2200)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const total         = counts.positive + counts.negative + counts.neutral || 1
  const positiveRatio = Math.round((counts.positive / total) * 100)
  const negativeRatio = Math.round((counts.negative / total) * 100)
  const neutralRatio  = Math.round((counts.neutral  / total) * 100)

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
      {/* Header bar */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, background: isDark ? '#111' : '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#E53E3E','#F59E0B','#2E8B57'].map(c => (
              <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: isDark ? '#4B5563' : '#9CA3AF', fontWeight: 600 }}>
            Gantra — لوحة المراقبة المباشرة
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', boxShadow: '0 0 6px #2E8B57', animation: 'livePulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.68rem', color: '#2E8B57', fontWeight: 700 }}>مباشر</span>
          <button onClick={() => setIsRunning(r => !r)} style={{ marginRight: '8px', padding: '3px 10px', borderRadius: '6px', border: `1px solid ${isDark ? '#2A2A2A' : '#E5E7EB'}`, background: 'transparent', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF' }}>
            {isRunning ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'إجمالي الإشارات', value: totalMentions.toLocaleString(), color: '#C9A84C', sub: '↑ مباشر' },
            { label: 'إيجابي',          value: `${positiveRatio}%`,            color: '#2E8B57', sub: `${counts.positive} منشور` },
            { label: 'سلبي',            value: `${negativeRatio}%`,            color: '#E53E3E', sub: `${counts.negative} منشور` },
          ].map(k => (
            <div key={k.label} style={{ borderRadius: '12px', padding: '10px 12px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}` }}>
              <p style={{ fontSize: '0.6rem', color: isDark ? '#6B7280' : '#9CA3AF', margin: '0 0 3px', fontWeight: 600 }}>{k.label}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 900, color: k.color, margin: '0 0 2px', lineHeight: 1 }}>{k.value}</p>
              <p style={{ fontSize: '0.58rem', color: k.color, margin: 0, opacity: 0.7 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Sentiment bar */}
        <div style={{ borderRadius: '12px', padding: '10px 14px', background: isDark ? '#161616' : '#F8FAFC', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}` }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF', margin: '0 0 8px' }}>توزيع المشاعر</p>
          <div style={{ display: 'flex', borderRadius: '99px', overflow: 'hidden', height: '8px', gap: '2px' }}>
            <div style={{ width: `${positiveRatio}%`, background: '#2E8B57', borderRadius: '99px', transition: 'width 0.8s ease' }} />
            <div style={{ width: `${neutralRatio}%`,  background: '#C9A84C', borderRadius: '99px', transition: 'width 0.8s ease' }} />
            <div style={{ width: `${negativeRatio}%`, background: '#E53E3E', borderRadius: '99px', transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            {[
              { label: 'إيجابي', color: '#2E8B57', pct: positiveRatio },
              { label: 'محايد',  color: '#C9A84C', pct: neutralRatio  },
              { label: 'سلبي',   color: '#E53E3E', pct: negativeRatio },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: '0.6rem', color: isDark ? '#6B7280' : '#9CA3AF' }}>{s.label} {s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live feed */}
        <div style={{ borderRadius: '12px', border: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: isDark ? '#161616' : '#F8FAFC', borderBottom: `1px solid ${isDark ? '#1E1E1E' : '#F0F0EC'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={11} color="#C9A84C" />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#6B7280' : '#9CA3AF' }}>آخر المنشورات المرصودة</span>
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'hidden' }}>
            {posts.slice(0, 5).map((post, i) => {
              const platform = PLATFORM_CONFIG[post.platform]
              const sentiment = SENTIMENT_CONFIG[post.sentiment]
              const PIcon = platform.icon
              const SIcon = sentiment.icon
              return (
                <div key={post.id} style={{ padding: '9px 14px', borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F5F5F3'}`, display: 'flex', alignItems: 'flex-start', gap: '8px', animation: i === 0 ? 'slideIn 0.4s ease' : 'none', background: i === 0 ? (isDark ? '#C9A84C08' : '#C9A84C05') : 'transparent' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0, background: platform.color + '15', border: `1px solid ${platform.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PIcon size={11} color={platform.color} />
                  </div>
                  <p style={{ fontSize: '0.68rem', lineHeight: 1.55, color: isDark ? '#9CA3AF' : '#374151', margin: 0, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {post.text}
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '6px', flexShrink: 0, background: sentiment.bg, border: `1px solid ${sentiment.border}`, color: sentiment.color, fontSize: '0.58rem', fontWeight: 700 }}>
                    <SIcon size={9} />{sentiment.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function StarsDisplay({ value, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: `${size}px`, color: s <= Math.round(value || 0) ? '#F59E0B' : '#D1D5DB' }}>★</span>
      ))}
    </span>
  )
}

function NPSBadge({ score }) {
  const color = score >= 9 ? '#2E8B57' : score >= 7 ? '#F59E0B' : '#E53E3E'
  const bg    = score >= 9 ? '#2E8B5715' : score >= 7 ? '#F59E0B15' : '#E53E3E15'
  const bdr   = score >= 9 ? '#2E8B5730' : score >= 7 ? '#F59E0B30' : '#E53E3E30'
  return (
    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 9px', borderRadius: '8px', background: bg, color, border: `1px solid ${bdr}` }}>
      NPS {score}/10
    </span>
  )
}

function TestimonialsSection({ ui, isDark, t }) {
  const [testimonials, setTestimonials] = useState([])
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [activeIdx,    setActiveIdx]    = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, sRes] = await Promise.all([api.getTestimonials(), api.getFeedbackStats()])
        if (tRes.ok) setTestimonials(await tRes.json())
        if (sRes.ok) setStats(await sRes.json())
      } catch (_) {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (testimonials.length <= 1) return
    const id = setInterval(() => setActiveIdx(p => (p + 1) % testimonials.length), 5000)
    return () => clearInterval(id)
  }, [testimonials.length])

  if (loading || (!stats?.total && testimonials.length === 0)) return null

  const npsColor = !stats?.nps_score ? '#6B7280'
    : stats.nps_score >= 50 ? '#2E8B57'
    : stats.nps_score >= 0  ? '#F59E0B'
    : '#E53E3E'

  const visible = testimonials.slice(0, 6)

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
          <Star size={12} />
          {t('home.testimonials.badge', 'آراء المستخدمين')}
        </span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {t('home.testimonials.title', 'ماذا يقول من جرّبوا المنصة؟')}
        </h2>
        <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0, maxWidth: '520px' }}>
          {t('home.testimonials.description', 'آراء حقيقية من مستخدمين جرّبوا Gantra')}
        </p>
      </div>

      {stats?.total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
          {[
            { label: t('home.testimonials.stats.nps', 'مؤشر الرضا'), value: `${stats.nps_score > 0 ? '+' : ''}${stats.nps_score}`, color: npsColor, sub: t('home.testimonials.stats.from', 'من {{count}} مستخدم', { count: stats.total }), isNps: true },
            { label: t('home.testimonials.stats.accuracy', 'دقة التحليل'),      value: stats.avg_accuracy,  color: '#F59E0B', stars: true },
            { label: t('home.testimonials.stats.usability', 'سهولة الاستخدام'), value: stats.avg_usability, color: '#4A90D9', stars: true },
            { label: t('home.testimonials.stats.coverage', 'التغطية'),           value: stats.avg_coverage,  color: '#2E8B57', stars: true },
          ].map(k => (
            <div key={k.label} style={{ padding: '18px 20px', borderRadius: '18px', background: ui.surface, border: `1px solid ${ui.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: k.color }} />
              <p style={{ fontSize: '11px', fontWeight: 600, color: ui.muted, margin: '0 0 6px' }}>{k.label}</p>
              <p style={{ fontSize: k.isNps ? '32px' : '28px', fontWeight: 900, color: k.color, margin: '0 0 4px', lineHeight: 1 }}>
                {k.value}{!k.isNps && <span style={{ fontSize: '14px', color: ui.muted, fontWeight: 400 }}>/5</span>}
              </p>
              {k.sub && <p style={{ fontSize: '11px', color: ui.muted, margin: 0 }}>{k.sub}</p>}
              {k.stars && <StarsDisplay value={k.value} />}
            </div>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: testimonials.length > 3 ? '16px' : 0 }}>
            {visible.map(item => (
              <div key={item.id}
                style={{ padding: '24px', borderRadius: '22px', background: ui.surface, border: `1px solid ${ui.border}`, display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.boxShadow = isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
                <div style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '64px', lineHeight: 1, fontFamily: 'Georgia, serif', color: isDark ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.1)', pointerEvents: 'none', userSelect: 'none' }}>"</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <NPSBadge score={item.nps_score} />
                  <StarsDisplay value={item.accuracy_rating} size={13} />
                </div>
                {item.comment && (
                  <p style={{ fontSize: '13px', lineHeight: 1.75, color: ui.text, margin: 0, fontStyle: 'italic', flex: 1, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{item.comment}"
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '12px', borderTop: `1px solid ${ui.border}` }}>
                  {[
                    { label: 'دقة التحليل',      value: item.accuracy_rating,  color: '#F59E0B' },
                    { label: 'سهولة الاستخدام',  value: item.usability_rating, color: '#4A90D9' },
                    { label: 'التغطية',           value: item.coverage_rating,  color: '#2E8B57' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: '60px' }}>
                      <span style={{ fontSize: '10px', color: ui.muted, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ flex: 1, height: '4px', borderRadius: '999px', background: isDark ? '#1E1E1E' : '#F0F0F0', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '999px', width: `${((value || 0) / 5) * 100}%`, background: color, transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color, flexShrink: 0 }}>{value}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #C9A84C, #2E8B57)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                    {item.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: ui.text, margin: 0 }}>{item.display_name}</p>
                    <p style={{ fontSize: '11px', color: ui.muted, margin: 0 }}>{t('home.testimonials.verifiedUser', 'مستخدم موثوق')}</p>
                  </div>
                  <div style={{ marginRight: 'auto', width: '20px', height: '20px', borderRadius: '50%', background: '#2E8B5715', border: '1px solid #2E8B5730', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#2E8B57' }}>✓</div>
                </div>
              </div>
            ))}
          </div>
          {testimonials.length > 3 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
              {visible.map((_, i) => (
                <button key={i} onClick={() => setActiveIdx(i)} style={{ height: '6px', borderRadius: '999px', border: 'none', cursor: 'pointer', transition: 'all 0.3s', width: i === activeIdx % visible.length ? '24px' : '6px', background: i === activeIdx % visible.length ? '#C9A84C' : ui.border, padding: 0 }} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ─── Public Navbar ────────────────────────────────────────────────────────────

function PublicNavbar({ ui, isDark }) {
  const { t }                  = useTranslation()
  const { toggleTheme }        = useTheme()
  const { i18n }               = useTranslation()
  const navigate               = useNavigate()
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
        .pub-nav-links { display: flex; }
        .pub-nav-hamburger { display: none !important; }
        @media (max-width: 860px) {
          .pub-nav-links { display: none !important; }
          .pub-nav-hamburger { display: flex !important; }
        }
      `}</style>

      <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, borderBottom: `1px solid ${nb.border}`, background: nb.bg, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>

          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={gantraLogo} alt="Gantra" style={{ height: '42px', filter: isDark ? 'none' : 'brightness(0.85)' }} />
          </NavLink>

          {/* Desktop nav */}
          <div className="pub-nav-links" style={{ alignItems: 'center', gap: '4px' }}>
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
            >
              {t('home.nav.about', 'من نحن')}
            </NavLink>

            <NavLink to="/contact-us"
              style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: nb.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
              onMouseLeave={e => e.currentTarget.style.color = nb.muted}
            >
              {t('footer.contactUs', 'تواصل معنا')}
            </NavLink>
          </div>

          {/* Right controls */}
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
            >
              {t('navigation.login', 'تسجيل الدخول')}
            </NavLink>

            <button className="pub-nav-hamburger" onClick={() => setMobileOpen(v => !v)}
              style={{ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`, background: isDark ? '#1A1A1A' : '#F0F0EC', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${nb.border}`, background: isDark ? '#0A0A0A' : '#F8FAFC', padding: '12px 1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              {t('home.nav.products', 'المنتجات')}
            </p>
            {PRODUCTS.map(p => (
              <div key={p.label} onClick={() => { navigate(p.path); setMobileOpen(false) }}
                style={{ padding: '10px 0', borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F0F0EC'}`, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111' }}
              >
                {p.label}
              </div>
            ))}
            <NavLink to="/about" onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '10px 0', borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F0F0EC'}`, fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111', textDecoration: 'none' }}
            >
              {t('home.nav.about', 'من نحن')}
            </NavLink>
            <NavLink to="/contact-us" onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '10px 0', fontSize: '0.84rem', fontWeight: 600, color: isDark ? '#E5E7EB' : '#111', textDecoration: 'none' }}
            >
              {t('footer.contactUs', 'تواصل معنا')}
            </NavLink>
          </div>
        )}
      </header>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { t }           = useTranslation()
  const { currentLang } = useLanguage()
  const { theme }       = useTheme()
  const isDark          = theme === 'dark'
  const [isVisible, setIsVisible] = useState(false)
  const [counters,  setCounters]  = useState({ posts: 0, accuracy: 0, platforms: 0 })

  const ui = {
    bg:       isDark ? '#0A0A0A' : '#F8FAFC',
    surface:  isDark ? '#111111' : '#FFFFFF',
    surface2: isDark ? '#161616' : '#F1F5F9',
    border:   isDark ? '#1E1E1E' : '#E2E8F0',
    text:     isDark ? '#E5E7EB' : '#0F172A',
    muted:    isDark ? '#6B7280' : '#64748B',
    subtle:   isDark ? '#9CA3AF' : '#475569',
  }

  useEffect(() => {
    setIsVisible(true)
    const targets = { posts: 3428, accuracy: 72, platforms: 4 }
    const duration = 1600
    const steps = 55
    let step = 0
    const timer = setInterval(() => {
      step++
      const ease = 1 - Math.pow(1 - step / steps, 3)
      setCounters({
        posts:     Math.round(targets.posts     * ease),
        accuracy:  Math.round(targets.accuracy  * ease),
        platforms: Math.round(targets.platforms * ease),
      })
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [])

  const SERVICES = [
    { icon: Activity,  key: 'posts',      color: '#4A90D9', title: t('dashboard.posts',      'رصد المنشورات'),    desc:t('home.services.postsDescription', 'جمع المنشورات تلقائياً من المنصات الاجتماعية المدعومة ومعالجتها في الوقت الفعلي.') },
    { icon: ThumbsUp,  key: 'sentiment',  color: '#2E8B57', title: t('dashboard.sentiment',  'تحليل المشاعر'),   desc: t('home.services.sentimentDescription', 'تصنيف المشاعر (إيجابي / سلبي / محايد) باستخدام نماذج ذكاء اصطناعي مدرّبة على اللهجة الجزائرية والمغاربية.') },
    { icon: Hash,      key: 'topics',     color: '#F59E0B', title: t('dashboard.topics',     'المواضيع الرائجة'), desc: t('home.services.topicsDescription', 'استخراج المواضيع والكلمات الأكثر تكراراً من المنشورات لمعرفة ما يتداوله جمهورك.') },
    { icon: Bell,      key: 'alerts',     color: '#E53E3E', title: t('dashboard.alerts',     'التنبيهات'),        desc: t('home.services.alertsDescription', 'إرسال تنبيهات عند ارتفاع ملحوظ في المشاعر السلبية أو تجاوز عتبات محددة.') },
    { icon: BarChart2, key: 'engagement', color: '#8B5CF6', title: t('dashboard.engagement', 'إحصاءات التفاعل'), desc: t('home.services.engagementDescription', 'عرض بيانات الإعجابات والتعليقات والمشاركات لقياس مدى تفاعل الجمهور مع العلامة.') },
    { icon: Brain,     key: 'insights',   color: '#C9A84C', title: t('dashboard.insights',   'التقارير'),         desc: t('home.services.insightsDescription', 'تقارير تلقائية تُلخّص البيانات المجمّعة وتعرضها بشكل قابل للتصدير.') },
  ]

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes livePulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes slideIn    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
        }
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-grid     { grid-template-columns: 1fr; }
          .services-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-grid    { grid-template-columns: repeat(3, 1fr); }
          .about-grid    { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .services-grid { grid-template-columns: 1fr; }
          .stats-grid    { grid-template-columns: 1fr; }
        }
      `}</style>

      <PublicNavbar ui={ui} isDark={isDark} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '6rem', paddingTop: '6rem', paddingBottom: '5rem' }}>

        {/* HERO */}
        <section
          className="hero-grid"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.9s ease' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', width: 'fit-content', border: '1px solid rgba(46,139,87,0.4)', background: 'rgba(46,139,87,0.08)', color: '#2E8B57', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', animation: 'pulse 2s infinite' }} />
              {t('home.tagline', 'منصة ذكاء اصطناعي للسوق الجزائري')}
            </span>

            <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', fontWeight: 900, lineHeight: 1.2, margin: 0, color: ui.text, letterSpacing: '-0.02em' }}>
              {t('home.title', 'افهم ما يقوله')}{' '}
              <span style={{ background: 'linear-gradient(135deg, #2E8B57, #4A90D9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('home.subtitle', 'جمهورك')}
              </span>
              {' '}{t('home.titleEnd', 'في الوقت الفعلي')}
            </h1>

            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: ui.muted, margin: 0, maxWidth: '480px' }}>
              {t('home.description', 'Gantra منصة لرصد وتحليل مشاعر الجمهور الجزائري عبر مواقع التواصل الاجتماعي، تعتمد على نماذج ذكاء اصطناعي مدرّبة على اللهجة الجزائرية والمغاربية.')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <NavLink to="/request-access"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, background: '#2E8B57', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(46,139,87,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3DAA6A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2E8B57'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {t('home.requestTrial', 'اطلب وصولاً تجريبياً')}
              </NavLink>
              <NavLink to="/login"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
              >
                {t('navigation.login', 'تسجيل الدخول')}
              </NavLink>
            </div>
          </div>

          <div style={{ animation: isVisible ? 'fadeUp 0.9s ease 0.2s both' : 'none' }}>
            <LiveDashboard isDark={isDark} />
          </div>
        </section>

        {/* STATS BAR */}
        <section style={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to left, #C9A84C, #2E8B57, #4A90D9)' }} />
          <div className="stats-grid">
            {[
              { value: counters.posts.toLocaleString(), suffix: '+', label: t('home.stats.posts', 'منشور في قاعدة البيانات'), sublabel: t('home.stats.postsNote', 'بيانات تدريب وتقييم'), icon: MessageSquare, color: '#4A90D9' },
              { value: counters.accuracy, suffix: '%', label: t('home.stats.accuracy', 'دقة تصنيف المشاعر'), sublabel: t('home.stats.accuracyNote', 'على بيانات الاختبار'), icon: Target, color: '#2E8B57' },
              { value: counters.platforms, suffix: '', label: t('home.stats.platforms', 'منصات مدعومة'), sublabel: t('home.stats.platformsNote', 'Facebook · Instagram · TikTok · YouTube'), icon: Globe, color: '#C9A84C' },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} style={{ padding: '2rem 1.5rem', textAlign: 'center', borderLeft: i > 0 ? `1px solid ${ui.border}` : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? '#161616' : '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: stat.color + '15', border: `1px solid ${stat.color}25`, marginBottom: '0.75rem' }}>
                    <Icon size={18} color={stat.color} />
                  </div>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: stat.color, margin: '0 0 4px', lineHeight: 1 }}>
                    {stat.value}{stat.suffix}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: ui.text, margin: '0 0 3px', fontWeight: 700 }}>{stat.label}</p>
                  <p style={{ fontSize: '0.68rem', color: ui.muted, margin: 0 }}>{stat.sublabel}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* SERVICES */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', marginBottom: '12px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: '0.75rem', fontWeight: 700 }}>
              ✦ {t('dashboard.services', 'الخدمات')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: ui.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t('home.services.title', 'ما الذي تقدمه المنصة؟')}
            </h2>
            <p style={{ fontSize: '0.88rem', color: ui.muted, margin: '0 auto', maxWidth: '520px' }}>
              {t('home.services.subtitle', 'من جمع البيانات إلى التقارير — كل شيء في مكان واحد')}
            </p>
          </div>
          <div className="services-grid">
            {SERVICES.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.key}
                  style={{ borderRadius: '20px', padding: '1.5rem', border: `1px solid ${ui.border}`, background: ui.surface, position: 'relative', overflow: 'hidden', transition: 'all 0.25s', animation: `fadeUp 0.5s ease ${i * 0.07}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '60'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${s.color}15` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: s.color }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '13px', background: s.color + '18', border: `1px solid ${s.color}30`, color: s.color, marginBottom: '1rem' }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: ui.text, margin: '0 0 8px' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: ui.muted, margin: 0 }}>{s.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to left, #4A90D9, #2E8B57, #C9A84C)' }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 8px' }}>
              {t('home.howItWorks.title', 'كيف تعمل المنصة؟')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0 }}>
              {t('home.howItWorks.description', 'ثلاث خطوات من الرصد إلى النتائج')}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { num: '01', title: t('home.howItWorks.step1.title', 'جمع المنشورات'),  desc: t('home.howItWorks.step1.description', 'تُجمع المنشورات من المنصات المدعومة بشكل دوري وتُخزَّن في قاعدة البيانات.'), accent: '#2E8B57' },
              { num: '02', title: t('home.howItWorks.step2.title', 'تحليل المشاعر'), desc: t('home.howItWorks.step2.description', 'يُصنَّف كل منشور تلقائياً إلى إيجابي أو سلبي أو محايد بنموذج ذكاء اصطناعي.'), accent: '#4A90D9' },
              { num: '03', title: t('home.howItWorks.step3.title', 'عرض النتائج'),   desc: t('home.howItWorks.step3.description', 'تُعرض البيانات في لوحة تحكم واضحة مع تنبيهات وتقارير قابلة للتصدير.'), accent: '#C9A84C' },
            ].map(s => (
              <div key={s.num} style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '18px', background: s.accent + '15', border: `1px solid ${s.accent}30`, color: s.accent, fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem' }}>{s.num}</div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: ui.text, margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: ui.muted, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PLATFORMS */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: ui.text, margin: '0 0 6px' }}>
              {t('home.platforms.title', 'المنصات المدعومة حالياً')}
            </h2>
            <p style={{ fontSize: '0.82rem', color: ui.muted, margin: 0 }}>
              {t('home.platforms.description', 'نرصد المنشورات العامة من هذه المنصات')}
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {[
              { name: 'Facebook',  color: '#60A5FA', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /> },
              { name: 'Instagram', color: '#F472B6', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" /> },
              { name: 'TikTok',   color: '#34D399', icon: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z" /> },
              { name: 'YouTube',  color: '#F87171', icon: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /> },
            ].map(({ name, color, icon }) => (
              <div key={name}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '16px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '16px 28px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}20` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <svg style={{ width: '28px', height: '28px', fill: color }} viewBox="0 0 24 24">{icon}</svg>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: ui.muted }}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* WHO WE SERVE */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface2, padding: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: ui.text, margin: '0 0 6px' }}>
            {t('home.whoWeServe.title', 'لمن تُفيد هذه المنصة؟')}
          </h2>
          <p style={{ fontSize: '0.82rem', color: ui.muted, margin: '0 0 1.25rem' }}>
            {t('home.whoWeServe.description', 'أي جهة تريد معرفة ما يُقال عنها أو عن منافسيها على الإنترنت')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { label: t('home.whoWeServe.localBrands',     'العلامات التجارية المحلية'),  accent: '#2E8B57', bg: 'rgba(46,139,87,0.08)',   border: 'rgba(46,139,87,0.3)'   },
              { label: t('home.whoWeServe.smes',            'المؤسسات الصغيرة والمتوسطة'), accent: '#4A90D9', bg: 'rgba(74,144,217,0.08)', border: 'rgba(74,144,217,0.3)'  },
              { label: t('home.whoWeServe.customerService', 'فرق خدمة العملاء'),           accent: '#C9A84C', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)'  },
              { label: t('home.whoWeServe.agencies',        'وكالات التسويق الرقمي'),       accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)'  },
              { label: t('home.whoWeServe.researchers',     'الباحثون والأكاديميون'),        accent: '#E53E3E', bg: 'rgba(229,62,62,0.08)',  border: 'rgba(229,62,62,0.3)'   },
            ].map(({ label, accent, bg, border }) => (
              <span key={label} style={{ padding: '9px 20px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, border: `1px solid ${border}`, color: accent, background: bg }}>
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* ── ABOUT US — updated wording ── */}
        <section className="about-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', width: 'fit-content', border: '1px solid rgba(74,144,217,0.35)', background: 'rgba(74,144,217,0.08)', color: '#4A90D9', fontSize: '0.75rem', fontWeight: 700 }}>
              <Users size={12} />
              {t('home.about.badge', 'عن المنصة')}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: ui.text, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {t('home.about.title', 'منصة جزائرية لرصد وتحليل المشاعر')}
            </h2>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.9, color: ui.muted, margin: 0 }}>
              {t('home.about.description', 'Gantra منصة متكاملة لرصد ما يُقال عن علامتك التجارية عبر مواقع التواصل الاجتماعي، مع تحليل المشاعر باللهجة الجزائرية والمغاربية. تجمع المنصة البيانات تلقائياً وتحوّلها إلى تقارير واضحة تساعدك على اتخاذ قرارات مبنية على معطيات حقيقية.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: Cpu,   color: '#4A90D9', text: t('home.about.point1', 'تحليل المشاعر باللهجة الجزائرية والمغاربية والعربية الفصحى') },
                { icon: Globe, color: '#2E8B57', text: t('home.about.point2', 'رصد المنشورات من Facebook وInstagram وTikTok وYouTube') },
                { icon: Zap,   color: '#C9A84C', text: t('home.about.point3', 'تقارير ذكية وتنبيهات فورية عند تغيّر المشاعر') },
                { icon: Award, color: '#8B5CF6', text: t('home.about.point4', 'لوحة تحكم واضحة مع إحصاءات التفاعل والمواضيع الرائجة') },
              ].map(({ icon: Icon, color, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: color + '15', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={color} />
                  </div>
                  <span style={{ fontSize: '0.82rem', color: ui.subtle, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            <NavLink to="/about"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(74,144,217,0.35)', color: '#4A90D9', background: 'rgba(74,144,217,0.06)', textDecoration: 'none', width: 'fit-content', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {t('home.about.cta', 'اعرف أكثر عن المنصة')}
              <ArrowLeft size={14} />
            </NavLink>
          </div>

          {/* Right: stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: t('home.about.stat1', 'منشور في قاعدة البيانات'),          value: '3,428', color: '#4A90D9', icon: MessageSquare },
              { label: t('home.about.stat2', 'دقة التصنيف على بيانات الاختبار'), value: '72%',   color: '#2E8B57', icon: Target       },
              { label: t('home.about.stat3', 'منصات مرصودة'),                     value: '4',     color: '#C9A84C', icon: Activity      },
              { label: t('home.about.stat4', 'لهجات مدعومة'),                     value: '2+',    color: '#8B5CF6', icon: Globe         },
            ].map(({ label, value, color, icon: Icon }, i) => (
              <div key={label} style={{ borderRadius: '18px', padding: '1.5rem', border: `1px solid ${ui.border}`, background: ui.surface, display: 'flex', flexDirection: 'column', gap: '8px', animation: `fadeUp 0.5s ease ${i * 0.1}s both`, position: 'relative', overflow: 'hidden', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '15', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '0.72rem', color: ui.muted, margin: 0, fontWeight: 600, lineHeight: 1.4 }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <TestimonialsSection ui={ui} isDark={isDark} t={t} />

        {/* CTA */}
        <section style={{ borderRadius: '28px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(46,139,87,0.25)', background: isDark ? 'linear-gradient(135deg, rgba(46,139,87,0.08) 0%, rgba(74,144,217,0.08) 100%)' : 'linear-gradient(135deg, rgba(46,139,87,0.06) 0%, rgba(74,144,217,0.06) 100%)' }}>
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '250px', height: '250px', borderRadius: '50%', background: '#2E8B57', opacity: 0.05, filter: 'blur(60px)' }} />
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
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 32px', fontSize: '0.9rem', fontWeight: 700, background: '#2E8B57', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(46,139,87,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3DAA6A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2E8B57'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {t('home.requestTrial', 'اطلب وصولاً تجريبياً')}
            </NavLink>
            <NavLink to="/contact-us"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '12px 28px', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.subtle }}
            >
              {t('footer.contactUs', 'تواصل معنا')}
            </NavLink>
          </div>
        </section>

      </div>
    </div>
  )
}