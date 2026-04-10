import { SENTIMENT, classifySentimentDarija } from './mockSentiment.js'

const basePosts = [
  {
    id: 'tw-1',
    source: 'twitter',
    author: '@dz_customer',
    text: 'الخدمة اليوم كانت هايلة بزاف، يعيشكوم على السرعة 👏',
  },
  {
    id: 'tw-2',
    source: 'twitter',
    author: '@hichem_dz',
    text: 'الابليكاسيون يطيح كل مرة نحب نخلص، كارثة صراحة.',
  },
  {
    id: 'fb-1',
    source: 'facebook',
    author: 'Nadia',
    text: 'تجربة مقبولة بصح خدمة الزبائن ما عجبونيش بزاف.',
  },
  {
    id: 'fb-2',
    source: 'facebook',
    author: 'Youcef',
    text: 'يعطيكم الصحة، عاودت طلبت من عندكم وكل مرة تتحسن الخدمة.',
  },
  {
    id: 'ig-1',
    source: 'instagram',
    author: 'amira.dz',
    text: 'الواجهة الجديدة شابة بصح السرعة ما زال ناقصة شوية.',
  },
  {
    id: 'ig-2',
    source: 'instagram',
    author: 'brand_fan',
    text: 'top top top، نخيركم دايما على باقي المنافسين.',
  },
]

export function fetchMockSocialPosts() {
  return basePosts.map((post) => {
    const sentiment = classifySentimentDarija(post.text)
    return {
      ...post,
      sentiment,
      createdAt: new Date().toISOString(),
    }
  })
}

export function filterPostsBySource(posts, source) {
  if (source === 'all') return posts
  return posts.filter((post) => post.source === source)
}

export function isNegativeThresholdExceeded(summary, threshold = 40) {
  return summary.percentages.negative >= threshold
}

