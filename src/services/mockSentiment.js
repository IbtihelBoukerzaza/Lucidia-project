const positiveKeywords = [
  'هايل',
  'مليح',
  'شابة',
  'برافو',
  'يعطيكم الصحة',
  'يعطيك الصحة',
  'يعمرها دار',
  'قمه',
  'top',
]

const negativeKeywords = [
  'كارثة',
  'كارثي',
  'ماشي مليح',
  'رديء',
  'رديئة',
  'نطيح',
  'عييت',
  'ما عجبنيش',
  'زفت',
  'مصيبة',
]

export const SENTIMENT = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
}

export function classifySentimentDarija(text) {
  if (!text) return SENTIMENT.NEUTRAL

  const normalized = text.toLowerCase()

  const hasPositive = positiveKeywords.some((kw) => normalized.includes(kw.toLowerCase()))
  const hasNegative = negativeKeywords.some((kw) => normalized.includes(kw.toLowerCase()))

  if (hasPositive && !hasNegative) return SENTIMENT.POSITIVE
  if (hasNegative && !hasPositive) return SENTIMENT.NEGATIVE

  return SENTIMENT.NEUTRAL
}

export function summarizeSentiment(posts) {
  const totals = {
    [SENTIMENT.POSITIVE]: 0,
    [SENTIMENT.NEGATIVE]: 0,
    [SENTIMENT.NEUTRAL]: 0,
  }

  posts.forEach((post) => {
    const label = post.sentiment ?? classifySentimentDarija(post.text)
    totals[label] += 1
  })

  const totalCount = totals.positive + totals.negative + totals.neutral || 1

  return {
    totals,
    totalCount,
    percentages: {
      positive: Math.round((totals.positive / totalCount) * 100),
      negative: Math.round((totals.negative / totalCount) * 100),
      neutral: Math.round((totals.neutral / totalCount) * 100),
    },
  }
}

