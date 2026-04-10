import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SENTIMENT, summarizeSentiment } from '../services/mockSentiment.js'
import {
  fetchMockSocialPosts,
  filterPostsBySource,
  isNegativeThresholdExceeded,
} from '../services/mockSocialData.js'

const ALL_POSTS = fetchMockSocialPosts()

const SOURCE_LABELS = {
  all: 'allPlatforms',
  twitter: 'twitter',
  facebook: 'facebook',
  instagram: 'instagram',
}

const SENTIMENT_LABELS = {
  [SENTIMENT.POSITIVE]: 'positive',
  [SENTIMENT.NEGATIVE]: 'negative',
  [SENTIMENT.NEUTRAL]: 'neutral',
}

export default function SocialListeningPage() {
  const { t } = useTranslation()
  const [selectedSource, setSelectedSource] = useState('all')
  const [negativeThreshold] = useState(40)

  const { visiblePosts, summary, alertActive } = useMemo(() => {
    const filtered = filterPostsBySource(ALL_POSTS, selectedSource)
    const sentimentSummary = summarizeSentiment(filtered)
    const hasAlert = isNegativeThresholdExceeded(sentimentSummary, negativeThreshold)

    return {
      visiblePosts: filtered,
      summary: sentimentSummary,
      alertActive: hasAlert,
    }
  }, [selectedSource, negativeThreshold])

  return (
    <div className="space-y-12">
      {/* Hero + value */}
      <section className="space-y-4">
        <p className="text-[11px] font-semibold text-sky-300">{t('socialListening.tagline')}</p>
        <h1 className="text-2xl font-bold text-slate-50">
          {t('socialListening.title')}
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          {t('socialListening.description')}
        </p>
      </section>

      {alertActive && (
        <section className="rounded-2xl border border-rose-600/70 bg-rose-950/60 p-4 text-xs text-rose-50">
          <p className="font-semibold">{t('socialListening.warning')}</p>
          <p className="mt-1 text-rose-100">
            {t('socialListening.warningDescription', { threshold: negativeThreshold.toString() })}
          </p>
        </section>
      )}

      {/* Reputation indicator */}
      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-slate-300">{t('socialListening.reputationIndicator')}</p>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              alertActive
                ? 'bg-rose-500/20 text-rose-300'
                : summary.percentages.positive >= 50
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {alertActive ? t('socialListening.attentionRisk') : summary.percentages.positive >= 50 ? t('socialListening.positiveReputation') : t('socialListening.moderateLevel')}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${summary.percentages.positive}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          {t('socialListening.positive', { percentage: summary.percentages.positive.toString() })} · {t('socialListening.negative', { percentage: summary.percentages.negative.toString() })} · {t('socialListening.neutral', { percentage: summary.percentages.neutral.toString() })}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold text-slate-300">{t('socialListening.distribution')}</p>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100 outline-none focus:border-sky-400"
            >
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(`socialListening.${label}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-emerald-500/10 p-3">
              <p className="text-[11px] text-emerald-200">{t('home.analytics.positive')}</p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">
                {summary.percentages.positive}%
              </p>
              <p className="mt-1 text-[10px] text-emerald-100">
                {summary.totals.positive} {t('socialListening.comments')}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-500/10 p-3">
              <p className="text-[11px] text-rose-200">{t('home.analytics.negative')}</p>
              <p className="mt-1 text-lg font-semibold text-rose-300">
                {summary.percentages.negative}%
              </p>
              <p className="mt-1 text-[10px] text-rose-100">
                {summary.totals.negative} {t('socialListening.comments')}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-500/10 p-3">
              <p className="text-[11px] text-slate-200">{t('home.analytics.neutral')}</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {summary.percentages.neutral}%
              </p>
              <p className="mt-1 text-[10px] text-slate-200">
                {summary.totals.neutral} {t('socialListening.comments')}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950/80 p-4 text-[11px] text-slate-300">
            <p>
              {t('socialListening.totalComments')}:{' '}
              <span className="font-semibold text-slate-50">{summary.totalCount}</span>
            </p>
            <p className="mt-1">
              {t('socialListening.negativeThreshold')}:{' '}
              <span className="font-semibold text-rose-300">{negativeThreshold}%</span>
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold text-slate-300">
              {t('socialListening.recentComments')}
            </p>
            <span className="text-[10px] text-slate-400">
              {t('socialListening.source')}: {t(`socialListening.${SOURCE_LABELS[selectedSource]}`)}
            </span>
          </div>

          <div className="space-y-3">
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-100">
                    {post.author}
                  </span>
                  <SentimentBadge sentiment={post.sentiment} />
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200">{post.text}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {t('socialListening.platform')}: {t(`socialListening.${SOURCE_LABELS[post.source]}`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function SentimentBadge({ sentiment }) {
  const { t } = useTranslation()
  
  let classes = 'bg-slate-700 text-slate-100'
  if (sentiment === SENTIMENT.POSITIVE) {
    classes = 'bg-emerald-500/15 text-emerald-200'
  } else if (sentiment === SENTIMENT.NEGATIVE) {
    classes = 'bg-rose-500/15 text-rose-200'
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${classes}`}>
      {t(`home.analytics.${SENTIMENT_LABELS[sentiment]}`)}
    </span>
  )
}
