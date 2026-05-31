import { NavLink } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import {
  TrendingUp, MessageSquare, Clock, Target,
  Brain, Globe, Zap, Shield, ChevronLeft, ChevronRight,
  Star, Quote,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import gantraLogo from '../assets/gantra-logo.png'
import { api } from '../services/api'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement
)

// ─── Testimonials Section ─────────────────────────────────────────────────────

function StarsDisplay({ value, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{
          fontSize: `${size}px`,
          color: s <= Math.round(value || 0) ? '#F59E0B' : '#D1D5DB',
        }}>★</span>
      ))}
    </span>
  )
}

function NPSBadge({ score }) {
  const color = score >= 9 ? '#2E8B57' : score >= 7 ? '#F59E0B' : '#E53E3E'
  const bg    = score >= 9 ? '#2E8B5715' : score >= 7 ? '#F59E0B15' : '#E53E3E15'
  const bdr   = score >= 9 ? '#2E8B5730' : score >= 7 ? '#F59E0B30' : '#E53E3E30'
  return (
    <span style={{
      fontSize: '11px', fontWeight: 800,
      padding: '2px 9px', borderRadius: '8px',
      background: bg, color, border: `1px solid ${bdr}`,
    }}>
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
        const [tRes, sRes] = await Promise.all([
          api.getTestimonials(),
          api.getFeedbackStats(),
        ])
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
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 14px', borderRadius: '999px', marginBottom: '12px',
          border: '1px solid rgba(201,168,76,0.35)',
          background: 'rgba(201,168,76,0.08)', color: '#C9A84C',
          fontSize: '0.75rem', fontWeight: 700,
        }}>
          <Star size={12} />
          {t('home.testimonials.badge', 'آراء العملاء')}
        </span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: ui.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {t('home.testimonials.title')}
        </h2>
        <p style={{ fontSize: '0.85rem', color: ui.muted, margin: 0, maxWidth: '520px' }}>
          {t('home.testimonials.description')}
        </p>
      </div>

      {stats?.total > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px', marginBottom: '2rem',
        }}>
          <div style={{ padding: '18px 20px', borderRadius: '18px', background: ui.surface, border: `1px solid ${ui.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: npsColor }} />
            <p style={{ fontSize: '11px', fontWeight: 600, color: ui.muted, margin: '0 0 6px' }}>{t('home.testimonials.stats.nps')}</p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: npsColor, margin: '0 0 4px', lineHeight: 1 }}>{stats.nps_score > 0 ? '+' : ''}{stats.nps_score}</p>
            <p style={{ fontSize: '11px', color: ui.muted, margin: 0 }}>{t('home.testimonials.stats.from', { count: stats.total })}</p>
          </div>
          <div style={{ padding: '18px 20px', borderRadius: '18px', background: ui.surface, border: `1px solid ${ui.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#F59E0B' }} />
            <p style={{ fontSize: '11px', fontWeight: 600, color: ui.muted, margin: '0 0 6px' }}>{t('home.testimonials.stats.accuracy')}</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#F59E0B', margin: '0 0 4px', lineHeight: 1 }}>{stats.avg_accuracy}<span style={{ fontSize: '14px', color: ui.muted, fontWeight: 400 }}>/5</span></p>
            <StarsDisplay value={stats.avg_accuracy} />
          </div>
          <div style={{ padding: '18px 20px', borderRadius: '18px', background: ui.surface, border: `1px solid ${ui.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#4A90D9' }} />
            <p style={{ fontSize: '11px', fontWeight: 600, color: ui.muted, margin: '0 0 6px' }}>{t('home.testimonials.stats.usability')}</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#4A90D9', margin: '0 0 4px', lineHeight: 1 }}>{stats.avg_usability}<span style={{ fontSize: '14px', color: ui.muted, fontWeight: 400 }}>/5</span></p>
            <StarsDisplay value={stats.avg_usability} />
          </div>
          <div style={{ padding: '18px 20px', borderRadius: '18px', background: ui.surface, border: `1px solid ${ui.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#2E8B57' }} />
            <p style={{ fontSize: '11px', fontWeight: 600, color: ui.muted, margin: '0 0 6px' }}>{t('home.testimonials.stats.coverage')}</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#2E8B57', margin: '0 0 4px', lineHeight: 1 }}>{stats.avg_coverage}<span style={{ fontSize: '14px', color: ui.muted, fontWeight: 400 }}>/5</span></p>
            <StarsDisplay value={stats.avg_coverage} />
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: testimonials.length > 3 ? '16px' : 0,
          }}>
            {visible.map((item) => (
              <div key={item.id} style={{
                padding: '24px', borderRadius: '22px',
                background: ui.surface, border: `1px solid ${ui.border}`,
                display: 'flex', flexDirection: 'column', gap: '16px',
                position: 'relative', overflow: 'hidden',
                transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.boxShadow = isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.boxShadow = 'none' }}
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
                    { label: t('home.testimonials.stats.accuracy'), value: item.accuracy_rating,  color: '#F59E0B' },
                    { label: t('home.testimonials.stats.usability'), value: item.usability_rating, color: '#4A90D9' },
                    { label: t('home.testimonials.stats.coverage'),  value: item.coverage_rating,  color: '#2E8B57' },
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
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #C9A84C, #2E8B57)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: '#fff', boxShadow: '0 2px 8px rgba(201,168,76,0.3)' }}>
                    {item.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: ui.text, margin: 0 }}>{item.display_name}</p>
                    <p style={{ fontSize: '11px', color: ui.muted, margin: 0 }}>{t('home.testimonials.verifiedClient', 'عميل موثوق')}</p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { t }           = useTranslation()
  const { currentLang } = useLanguage()
  const { theme }       = useTheme()
  const isDark          = theme === 'dark'

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible,    setIsVisible]    = useState(false)

  const ui = {
    bg:       isDark ? '#0A0A0A' : '#F8FAFC',
    surface:  isDark ? '#111111' : '#FFFFFF',
    surface2: isDark ? '#161616' : '#F1F5F9',
    border:   isDark ? '#1E1E1E' : '#E2E8F0',
    text:     isDark ? '#E5E7EB' : '#0F172A',
    muted:    isDark ? '#6B7280' : '#64748B',
    subtle:   isDark ? '#9CA3AF' : '#475569',
  }

  const slides = [
    { id: 1, icon: Brain,  title: t('home.features.aiAnalysis.title'),      description: t('home.features.aiAnalysis.description'),      accent: '#2E8B57', bg: 'rgba(46,139,87,0.12)'  },
    { id: 2, icon: Globe,  title: t('home.features.multiPlatform.title'),   description: t('home.features.multiPlatform.description'),   accent: '#4A90D9', bg: 'rgba(74,144,217,0.12)' },
    { id: 3, icon: Zap,    title: t('home.features.realTimeAlerts.title'),  description: t('home.features.realTimeAlerts.description'),  accent: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
    { id: 4, icon: Shield, title: t('home.features.brandProtection.title'), description: t('home.features.brandProtection.description'), accent: '#2E8B57', bg: 'rgba(46,139,87,0.12)'  },
  ]

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => { setIsVisible(true) }, [])

  return (
    <div dir="rtl" style={{ background: ui.bg, color: ui.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .analytics-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{
        maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '5rem',
        paddingTop: '3rem', paddingBottom: '5rem',
      }}>

        {/* ── HERO ── */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem', alignItems: 'center',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.8s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px', borderRadius: '999px', width: 'fit-content',
              border: '1px solid rgba(46,139,87,0.4)',
              background: 'rgba(46,139,87,0.08)', color: '#2E8B57',
              fontSize: '0.75rem', fontWeight: '600',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2E8B57', animation: 'pulse 2s infinite' }} />
              {t('home.tagline')}
            </span>

            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', lineHeight: '1.25', margin: 0, color: ui.text, letterSpacing: '-0.02em' }}>
              {t('home.title')}
              <span style={{ color: '#2E8B57' }}> {t('home.subtitle')}</span>
            </h1>

            <p style={{ fontSize: '0.9rem', lineHeight: '1.8', color: ui.muted, margin: 0, maxWidth: '520px' }}>
              {t('home.description')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <NavLink to="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '10px 28px', fontSize: '0.875rem', fontWeight: '700', background: '#2E8B57', color: '#fff', textDecoration: 'none', transition: 'all 0.2s', border: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3DAA6A'}
              onMouseLeave={e => e.currentTarget.style.background = '#2E8B57'}>
                {t('navigation.login')}
              </NavLink>
              <NavLink to="/request-access" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '10px 22px', fontSize: '0.875rem', fontWeight: '600', border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border;  e.currentTarget.style.color = ui.subtle }}>
                {t('home.requestTrial')}
              </NavLink>
            </div>

            <div style={{ display: 'flex', gap: '2rem', paddingTop: '0.5rem' }}>
              {[
                { value: '+50',  label: t('home.trust.brands')     },
                { value: '72%',  label: t('home.trust.accuracy')   },
                { value: '24/7', label: t('home.trust.monitoring') },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#C9A84C', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: '0.7rem', color: ui.muted, margin: 0, marginTop: '2px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature carousel */}
          <div style={{ position: 'relative', height: '320px', overflow: 'hidden', borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '1.5rem' }}>
            {slides.map((slide, index) => {
              const Icon   = slide.icon
              const active = index === currentSlide
              return (
                <div key={slide.id} style={{ position: 'absolute', inset: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.6s ease', pointerEvents: active ? 'auto' : 'none' }}>
                  <div style={{ borderRadius: '20px', padding: '1rem', marginBottom: '1rem', background: slide.bg }}>
                    <Icon style={{ width: '48px', height: '48px', color: slide.accent }} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: ui.text, textAlign: 'center', margin: '0 0 8px' }}>{slide.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: ui.muted, textAlign: 'center', lineHeight: '1.7', margin: 0 }}>{slide.description}</p>
                </div>
              )
            })}
            <button onClick={() => setCurrentSlide(p => (p - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', borderRadius: '50%', width: '32px', height: '32px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', color: ui.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>
            <button onClick={() => setCurrentSlide(p => (p + 1) % slides.length)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', borderRadius: '50%', width: '32px', height: '32px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', color: ui.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
            <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} style={{ height: '6px', borderRadius: '999px', border: 'none', cursor: 'pointer', width: i === currentSlide ? '24px' : '6px', background: i === currentSlide ? '#2E8B57' : ui.border, transition: 'all 0.3s', padding: 0 }} />
              ))}
            </div>
          </div>
        </section>

        {/* ── ANALYTICS ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, insetInline: 0, height: '3px', background: 'linear-gradient(to left, #4A90D9, #2E8B57, #C9A84C)', borderRadius: '3px 3px 0 0' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: ui.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp style={{ width: '18px', height: '18px', color: '#2E8B57' }} />
                {t('home.analytics.title')}
              </h2>
              <p style={{ fontSize: '0.82rem', color: ui.muted, margin: 0 }}>{t('home.analytics.description')}</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', background: 'rgba(201,168,76,0.08)' }}>
              {t('home.analytics.liveData')}
            </span>
          </div>

          {/* ← responsive: chart + stats side by side on desktop, stacked on mobile */}
          <div className="analytics-grid">
            <div style={{ borderRadius: '18px', border: `1px solid ${ui.border}`, background: ui.surface2, padding: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: '600', color: ui.text, margin: '0 0 1rem' }}>
                {t('home.analytics.sentimentEvolution')}
              </p>
              <div style={{ height: '220px' }}>
                <Line
                  data={{
                    labels: currentLang === 'ar'
                      ? ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان']
                      : currentLang === 'fr'
                      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin']
                      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                      { label: t('home.analytics.positive'), data: [45,52,58,62,65,68], borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.07)',  tension: 0.4, fill: true },
                      { label: t('home.analytics.neutral'),  data: [30,28,25,23,22,22], borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.07)', tension: 0.4, fill: true },
                      { label: t('home.analytics.negative'), data: [25,20,17,15,13,10], borderColor: '#E53E3E', backgroundColor: 'rgba(229,62,62,0.07)',  tension: 0.4, fill: true },
                    ],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { position: 'top', labels: { color: ui.muted, font: { size: 11 }, padding: 12 } },
                      tooltip: { backgroundColor: isDark ? 'rgba(17,17,17,0.95)' : 'rgba(255,255,255,0.98)', titleColor: ui.text, bodyColor: ui.muted, borderColor: ui.border, borderWidth: 1, callbacks: { label: c => c.dataset.label + ': ' + c.parsed.y + '%' } },
                    },
                    scales: {
                      x: { grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, ticks: { color: ui.muted, font: { size: 10 } } },
                      y: { grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, ticks: { color: ui.muted, font: { size: 10 }, callback: v => v + '%' } },
                    },
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: MessageSquare, label: t('home.analytics.totalComments'), value: '12,450', sub: t('home.analytics.thisMonth'),       accent: '#4A90D9', bg: 'rgba(74,144,217,0.1)'  },
                { icon: Target,        label: t('home.analytics.positiveRate'),  value: '68%',    sub: t('home.analytics.ofTotalComments'), accent: '#2E8B57', bg: 'rgba(46,139,87,0.1)'   },
                { icon: Clock,         label: t('home.analytics.lastUpdate'),    value: t('home.analytics.now'), sub: t('home.analytics.realTime'), accent: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
              ].map(({ icon: Icon, label, value, sub, accent, bg }) => (
                <div key={label} style={{ borderRadius: '16px', border: `1px solid ${ui.border}`, background: ui.surface2, padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ borderRadius: '12px', padding: '8px', background: bg, flexShrink: 0 }}>
                      <Icon style={{ width: '18px', height: '18px', color: accent }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: ui.muted, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700', color: ui.text, margin: '2px 0' }}>{value}</p>
                      <p style={{ fontSize: '0.68rem', color: accent, margin: 0 }}>{sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: ui.text, margin: '0 0 6px' }}>{t('home.howItWorks.title')}</h2>
          <p style={{ fontSize: '0.85rem', color: ui.muted, margin: '0 0 1.5rem', maxWidth: '560px' }}>{t('home.howItWorks.description')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { num: '1', title: t('home.howItWorks.step1.title'), desc: t('home.howItWorks.step1.description'), accent: '#2E8B57', bg: 'rgba(46,139,87,0.1)'  },
              { num: '2', title: t('home.howItWorks.step2.title'), desc: t('home.howItWorks.step2.description'), accent: '#4A90D9', bg: 'rgba(74,144,217,0.1)' },
              { num: '3', title: t('home.howItWorks.step3.title'), desc: t('home.howItWorks.step3.description'), accent: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
            ].map(({ num, title, desc, accent, bg }) => (
              <div key={num} style={{ borderRadius: '20px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '1.5rem', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ position: 'absolute', top: 0, insetInline: 0, height: '3px', background: accent, borderRadius: '3px 3px 0 0' }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '14px', background: bg, color: accent, fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem' }}>{num}</span>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: ui.text, margin: '0 0 6px' }}>{title}</h3>
                <p style={{ fontSize: '0.78rem', color: ui.muted, margin: 0, lineHeight: '1.7' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHAT WE OFFER ── */}
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: ui.text, margin: '0 0 6px' }}>{t('home.whatWeOffer.title')}</h2>
          <p style={{ fontSize: '0.85rem', color: ui.muted, margin: '0 0 1.5rem' }}>{t('home.whatWeOffer.description')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { emoji: '📊', title: t('home.whatWeOffer.sentimentAnalysis.title'),    desc: t('home.whatWeOffer.sentimentAnalysis.description'),    accent: '#2E8B57' },
              { emoji: '🇩🇿', title: t('home.whatWeOffer.dialectAnalysis.title'),     desc: t('home.whatWeOffer.dialectAnalysis.description'),     accent: '#4A90D9' },
              { emoji: '⚡',  title: t('home.whatWeOffer.reputationIndicator.title'), desc: t('home.whatWeOffer.reputationIndicator.description'), accent: '#C9A84C' },
            ].map(({ emoji, title, desc, accent }) => (
              <div key={title} style={{ borderRadius: '20px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '1.5rem', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'scale(1)' }}>
                <div style={{ position: 'absolute', top: 0, insetInline: 0, height: '3px', background: accent, borderRadius: '3px 3px 0 0' }} />
                <span style={{ fontSize: '1.75rem' }}>{emoji}</span>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: ui.text, margin: '12px 0 6px' }}>{title}</h3>
                <p style={{ fontSize: '0.78rem', color: ui.muted, margin: 0, lineHeight: '1.7', flex: 1 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLATFORMS ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface, padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: ui.text, margin: '0 0 4px' }}>{t('home.platforms.title')}</h2>
          <p style={{ fontSize: '0.82rem', color: ui.muted, margin: '0 0 1.25rem' }}>{t('home.platforms.description')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { name: t('home.platforms.twitter'),   color: '#94A3B8', icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
              { name: t('home.platforms.facebook'),  color: '#60A5FA', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /> },
              { name: t('home.platforms.instagram'), color: '#F472B6', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" /> },
              { name: 'TikTok',  color: '#34D399', icon: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z" /> },
              { name: 'YouTube', color: '#F87171', icon: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /> },
              { name: 'Reddit',  color: '#FCA5A5', icon: <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /> },
            ].map(({ name, color, icon }) => (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', border: `1px solid ${ui.border}`, background: ui.surface2, padding: '16px 24px', transition: 'all 0.2s', gap: '8px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                <svg style={{ width: '28px', height: '28px', fill: color }} viewBox="0 0 24 24">{icon}</svg>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: ui.muted }}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHO WE SERVE ── */}
        <section style={{ borderRadius: '24px', border: `1px solid ${ui.border}`, background: ui.surface2, padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: ui.text, margin: '0 0 4px' }}>{t('home.whoWeServe.title')}</h2>
          <p style={{ fontSize: '0.82rem', color: ui.muted, margin: '0 0 1.25rem' }}>{t('home.whoWeServe.description')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { label: t('home.whoWeServe.localBrands'),     accent: '#2E8B57', bg: 'rgba(46,139,87,0.08)',   border: 'rgba(46,139,87,0.3)'   },
              { label: t('home.whoWeServe.smes'),            accent: '#4A90D9', bg: 'rgba(74,144,217,0.08)', border: 'rgba(74,144,217,0.3)'  },
              { label: t('home.whoWeServe.customerService'), accent: '#C9A84C', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)'  },
              { label: t('home.whoWeServe.agencies'),        accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)'  },
            ].map(({ label, accent, bg, border }) => (
              <span key={label} style={{ padding: '8px 18px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', border: `1px solid ${border}`, color: accent, background: bg }}>{label}</span>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <TestimonialsSection ui={ui} isDark={isDark} t={t} />

        {/* ── CTA ── */}
        <section style={{ borderRadius: '24px', padding: '2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(46,139,87,0.25)', background: isDark ? 'linear-gradient(135deg, rgba(46,139,87,0.07) 0%, rgba(74,144,217,0.07) 100%)' : 'linear-gradient(135deg, rgba(46,139,87,0.05) 0%, rgba(74,144,217,0.05) 100%)' }}>
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#2E8B57', opacity: 0.04, filter: 'blur(48px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: '#4A90D9', opacity: 0.04, filter: 'blur(48px)' }} />
          <img src={gantraLogo} alt="Gantra" style={{ height: '56px', width: 'auto', objectFit: 'contain', margin: '0 auto 1.25rem', display: 'block', opacity: 0.9 }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: ui.text, margin: '0 0 8px' }}>{t('home.cta.title')}</h2>
          <p style={{ fontSize: '0.875rem', color: ui.muted, margin: '0 auto 1.75rem', maxWidth: '420px', lineHeight: '1.7' }}>{t('home.cta.description')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <NavLink to="/request-access" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '11px 28px', fontSize: '0.875rem', fontWeight: '700', background: '#2E8B57', color: '#fff', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3DAA6A'}
            onMouseLeave={e => e.currentTarget.style.background = '#2E8B57'}>
              {t('home.requestTrial')}
            </NavLink>
            <NavLink to="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', padding: '11px 26px', fontSize: '0.875rem', fontWeight: '600', border: `1px solid ${ui.border}`, color: ui.subtle, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ui.border;  e.currentTarget.style.color = ui.subtle }}>
              {t('navigation.login')}
            </NavLink>
          </div>
        </section>

      </div>
    </div>
  )
}