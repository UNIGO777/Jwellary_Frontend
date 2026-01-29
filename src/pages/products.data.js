export const formatInr = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatPercentOff = ({ priceInr, compareAtInr }) => {
  const price = Number(priceInr || 0)
  const compareAt = Number(compareAtInr || 0)
  if (!compareAt || compareAt <= price) return ''
  const percent = Math.round(((compareAt - price) / compareAt) * 100)
  if (!Number.isFinite(percent) || percent <= 0) return ''
  return `${percent}% OFF`
}

const unsplash = (id, width = 1200) => `https://unsplash.com/photos/${id}/download?force=true&w=${width}`

export const products = [
  {
    id: 'aurora-diamond-ring',
    name: 'Aurora Diamond Ring',
    category: 'Rings',
    priceInr: 45999,
    compareAtInr: 52999,
    metal: '18K Yellow Gold',
    stone: 'Diamond',
    purity: '18K',
    weightGrams: 3.2,
    inStock: true,
    badge: 'Sale',
    rating: 4.8,
    reviewsCount: 142,
    images: [unsplash('TLHbJJ7mE7U'), unsplash('PvySs_vHAug'), unsplash('ocrucJ78UFE'), unsplash('orVNEDAylaU')],
    highlights: ['Certified stones', 'Free resizing', 'Hallmarked gold'],
    description:
      'A timeless solitaire-inspired ring with a modern crown setting for everyday sparkle.',
    theme: 'from-rose-100 via-white to-amber-50'
  },
  {
    id: 'luna-pearl-necklace',
    name: 'Luna Pearl Necklace',
    category: 'Necklaces',
    priceInr: 29999,
    compareAtInr: 34999,
    metal: '925 Sterling Silver',
    stone: 'Pearl',
    purity: '925',
    weightGrams: 12.4,
    inStock: true,
    badge: 'New',
    rating: 4.6,
    reviewsCount: 86,
    images: [unsplash('2zHQhfEpisc'), unsplash('09bKHOZ29us'), unsplash('Q-T-QPWoN2s'), unsplash('PPizseKigaw')],
    highlights: ['Skin friendly', 'Anti-tarnish finish', 'Gift-ready box'],
    description:
      'Elegant freshwater pearls with a minimal clasp that pairs with both ethnic and western outfits.',
    theme: 'from-sky-100 via-white to-indigo-50'
  },
  {
    id: 'saffron-gold-bangle',
    name: 'Saffron Gold Bangle',
    category: 'Bangles',
    priceInr: 68999,
    compareAtInr: 74999,
    metal: '22K Gold',
    stone: 'None',
    purity: '22K',
    weightGrams: 18.8,
    inStock: true,
    badge: 'Sale',
    rating: 4.7,
    reviewsCount: 51,
    images: [unsplash('itriu-lCKzs'), unsplash('aldDZePniqg'), unsplash('3Y9NN5FlMTg'), unsplash('aldDZePniqg')],
    highlights: ['Hand-finished', 'Traditional design', 'Occasion wear'],
    description:
      'A classic bangle with intricate texture—perfect for weddings, festivals, and gifting.',
    theme: 'from-amber-100 via-white to-yellow-50'
  },
  {
    id: 'nova-stud-earrings',
    name: 'Nova Stud Earrings',
    category: 'Earrings',
    priceInr: 19999,
    compareAtInr: 23999,
    metal: '18K Rose Gold',
    stone: 'Diamond',
    purity: '18K',
    weightGrams: 2.1,
    inStock: true,
    badge: 'New',
    rating: 4.9,
    reviewsCount: 210,
    images: [unsplash('ZP7HXfjRVcY'), unsplash('CVwrlqCHBzw'), unsplash('XTp4ZzD76Xw'), unsplash('cTM8psdeOTQ')],
    highlights: ['Lightweight', 'Everyday wear', 'Secure back lock'],
    description:
      'Delicate diamond studs designed for comfort and shine from day to night.',
    theme: 'from-pink-100 via-white to-rose-50'
  },
  {
    id: 'noor-jhumka-earrings',
    name: 'Noor Jhumka Earrings',
    category: 'Earrings',
    priceInr: 15999,
    compareAtInr: 0,
    metal: '22K Gold',
    stone: 'None',
    purity: '22K',
    weightGrams: 4.8,
    inStock: true,
    badge: '',
    rating: 4.5,
    reviewsCount: 64,
    images: [unsplash('cTM8psdeOTQ'), unsplash('onk2WGxSV5I'), unsplash('XTp4ZzD76Xw'), unsplash('onk2WGxSV5I')],
    highlights: ['Festive wear', 'Traditional finish', 'Secure hook'],
    description: 'Classic jhumkas with a graceful bell shape and a subtle textured shine.',
    theme: 'from-amber-100 via-white to-orange-50'
  },
  {
    id: 'iris-diamond-pendant',
    name: 'Iris Diamond Pendant',
    category: 'Pendants',
    priceInr: 24999,
    compareAtInr: 28999,
    metal: '18K White Gold',
    stone: 'Diamond',
    purity: '18K',
    weightGrams: 1.9,
    inStock: true,
    badge: 'Sale',
    rating: 4.7,
    reviewsCount: 98,
    images: [unsplash('Q3dMusCuYKk'), unsplash('u1Hv_erOQH0'), unsplash('202NAwjisYA'), unsplash('mq26lgAjm2I')],
    highlights: ['Minimal design', 'Certified stones', 'Gift-ready box'],
    description: 'A bright pendant with a clean silhouette that layers beautifully with chains.',
    theme: 'from-slate-100 via-white to-sky-50'
  },
  {
    id: 'mira-tennis-bracelet',
    name: 'Mira Tennis Bracelet',
    category: 'Bracelets',
    priceInr: 38999,
    compareAtInr: 43999,
    metal: '925 Sterling Silver',
    stone: 'Crystal',
    purity: '925',
    weightGrams: 9.6,
    inStock: true,
    badge: 'Sale',
    rating: 4.6,
    reviewsCount: 73,
    images: [unsplash('LrQys_Ukuak'), unsplash('u3ysRArzqQA'), unsplash('oKb2_15Uc8w'), unsplash('u3ysRArzqQA')],
    highlights: ['Everyday shine', 'Secure clasp', 'Anti-tarnish finish'],
    description: 'A sleek tennis bracelet with uniform sparkle—easy to dress up or down.',
    theme: 'from-violet-100 via-white to-indigo-50'
  },
  {
    id: 'zara-stackable-rings',
    name: 'Zara Stackable Rings (Set)',
    category: 'Rings',
    priceInr: 17999,
    compareAtInr: 19999,
    metal: '18K Rose Gold',
    stone: 'None',
    purity: '18K',
    weightGrams: 2.7,
    inStock: true,
    badge: 'New',
    rating: 4.4,
    reviewsCount: 39,
    images: [unsplash('orVNEDAylaU'), unsplash('Lqfqsij4EvQ'), unsplash('baZJ_wJ4W-k'), unsplash('0lmrbbVx4HM')],
    highlights: ['Mix & match', 'Lightweight', 'Polished finish'],
    description: 'A set of three stackable rings designed for effortless everyday styling.',
    theme: 'from-rose-100 via-white to-pink-50'
  },
  {
    id: 'celeste-hoop-earrings',
    name: 'Celeste Hoop Earrings',
    category: 'Earrings',
    priceInr: 21999,
    compareAtInr: 0,
    metal: '18K Yellow Gold',
    stone: 'None',
    purity: '18K',
    weightGrams: 3.9,
    inStock: false,
    badge: 'Out of stock',
    rating: 4.3,
    reviewsCount: 22,
    images: [unsplash('ZP7HXfjRVcY'), unsplash('XTp4ZzD76Xw'), unsplash('CVwrlqCHBzw'), unsplash('cTM8psdeOTQ')],
    highlights: ['Classic hoops', 'Secure lock', 'Day-to-night'],
    description: 'Medium hoops with a smooth finish—an everyday essential in gold.',
    theme: 'from-yellow-100 via-white to-amber-50'
  }
]

export const getProductById = (id) => products.find((p) => p.id === id)

export const getProductCategories = () => {
  const set = new Set(products.map((p) => p.category))
  return ['All', ...Array.from(set)]
}
