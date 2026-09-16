import type { ListingCondition, ListingEnrichment } from '@/types'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  stroller: ['stroller', 'pram', 'pushchair', 'buggy'],
  car_seat: ['car seat', 'carseat', 'infant seat', 'convertible seat'],
  crib: ['crib', 'cot', 'bassinet', 'cradle', 'playard', 'pack n play'],
  high_chair: ['high chair', 'highchair', 'booster seat'],
  clothing: ['onesie', 'romper', 'bodysuit', 'baby clothes', 'romper', 'sleepsuit'],
  toys: ['toy', 'rattle', 'teether', 'play mat', 'activity gym', 'blocks'],
  feeding: ['bottle', 'breast pump', 'formula', 'sterilizer', 'bib', 'sippy'],
  diapering: ['diaper', 'nappy', 'changing table', 'wipe warmer'],
  bath: ['bathtub', 'bath tub', 'towel', 'washcloth'],
  carrier: ['baby carrier', 'wrap', 'sling', 'ergobaby', 'bjorn'],
  monitor: ['baby monitor', 'video monitor', 'nanny cam'],
}

const BRAND_HINTS = [
  'Graco',
  'Chicco',
  'BabyBjorn',
  'Ergobaby',
  'UPPAbaby',
  'Bugaboo',
  'Britax',
  'Maxi-Cosi',
  'Fisher-Price',
  'Skip Hop',
  'Baby Einstein',
  'Medela',
  'Philips Avent',
  'Nuna',
  'Cybex',
  'Evenflo',
  'Ingenuity',
]

/**
 * Infers a baby product category from free-text signals.
 * @param text - Combined labels / titles / entities
 */
export const inferCategory = (text: string) => {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category
    }
  }
  return 'other'
}

/**
 * Infers a brand name from free-text signals.
 * @param text - Combined labels / titles / entities
 */
export const inferBrand = (text: string) => {
  const found = BRAND_HINTS.find((brand) =>
    text.toLowerCase().includes(brand.toLowerCase())
  )
  return found ?? ''
}

/**
 * Infers age range hints from product text.
 * @param text - Combined labels / titles / entities
 */
export const inferAgeRange = (text: string) => {
  const lower = text.toLowerCase()
  if (lower.includes('newborn') || lower.includes('0-3')) return '0-3 months'
  if (lower.includes('infant') || lower.includes('0-6')) return '0-6 months'
  if (lower.includes('toddler')) return '1-3 years'
  if (lower.includes('6-12') || lower.includes('6 to 12')) return '6-12 months'
  return ''
}

/**
 * Builds a heuristic enrichment when external APIs are unavailable.
 * @param signals - Text fragments from filename or user hints
 */
export const buildHeuristicEnrichment = (signals: string[]): ListingEnrichment => {
  const text = signals.filter(Boolean).join(' ')
  const category = inferCategory(text)
  const brand = inferBrand(text)
  const ageRange = inferAgeRange(text)
  const titleParts = [brand, category === 'other' ? 'Baby item' : category.replace('_', ' ')]
    .filter(Boolean)
    .join(' ')

  return {
    source: 'heuristic',
    bestGuess: titleParts,
    title: titleParts,
    description:
      text
        ? `Auto-suggested from image cues: ${text.slice(0, 240)}`
        : 'Upload analyzed locally. Add a Google Vision or SerpAPI key for richer reverse-image results.',
    category,
    brand,
    ageRange,
    condition: 'good' as ListingCondition,
    suggestedPrice: null,
    labels: signals.slice(0, 12),
    rawSummary: text.slice(0, 500),
  }
}

interface VisionWebDetection {
  bestGuessLabels?: Array<{ label?: string }>
  webEntities?: Array<{ description?: string; score?: number }>
  visuallySimilarImages?: Array<{ url?: string }>
  fullMatchingImages?: Array<{ url?: string }>
  pagesWithMatchingImages?: Array<{ pageTitle?: string; url?: string }>
}

/**
 * Runs Google Cloud Vision Web Detection (reverse image style) on base64 image data.
 * @param base64 - Raw base64 image payload (no data-url prefix)
 * @param apiKey - Google Vision API key
 */
export const enrichWithGoogleVision = async (
  base64: string,
  apiKey: string
): Promise<ListingEnrichment> => {
  const endpoint =
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [
            { type: 'WEB_DETECTION', maxResults: 20 },
            { type: 'LABEL_DETECTION', maxResults: 15 },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Google Vision failed: ${response.status} ${errText}`)
  }

  const payload = (await response.json()) as {
    responses?: Array<{
      webDetection?: VisionWebDetection
      labelAnnotations?: Array<{ description?: string }>
      error?: { message?: string }
    }>
  }

  const first = payload.responses?.[0]
  if (first?.error?.message) {
    throw new Error(first.error.message)
  }

  const web = first?.webDetection
  const labels = (first?.labelAnnotations ?? [])
    .map((item) => item.description ?? '')
    .filter(Boolean)
  const entities = (web?.webEntities ?? [])
    .map((item) => item.description ?? '')
    .filter(Boolean)
  const bestGuess = web?.bestGuessLabels?.[0]?.label ?? entities[0] ?? labels[0] ?? ''
  const pageTitles = (web?.pagesWithMatchingImages ?? [])
    .map((page) => page.pageTitle ?? '')
    .filter(Boolean)
  const combined = [bestGuess, ...entities, ...labels, ...pageTitles].join(' ')

  const similarImageUrls = [
    ...(web?.fullMatchingImages ?? []),
    ...(web?.visuallySimilarImages ?? []),
  ]
    .map((img) => img.url ?? '')
    .filter(Boolean)
    .slice(0, 8)

  return {
    source: 'google_vision',
    bestGuess,
    title: bestGuess || inferBrand(combined) || 'Baby product',
    description: [
      bestGuess ? `Identified as: ${bestGuess}.` : '',
      entities.length ? `Related: ${entities.slice(0, 6).join(', ')}.` : '',
      pageTitles[0] ? `Seen on listings like: ${pageTitles[0]}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
    category: inferCategory(combined),
    brand: inferBrand(combined),
    ageRange: inferAgeRange(combined),
    condition: 'good',
    suggestedPrice: null,
    webEntities: entities.slice(0, 12),
    similarImageUrls,
    labels,
    rawSummary: combined.slice(0, 800),
  }
}

/**
 * Runs SerpAPI Google Lens reverse image search using a public image URL.
 * @param imageUrl - Publicly reachable image URL
 * @param apiKey - SerpAPI key
 */
export const enrichWithSerpApiLens = async (
  imageUrl: string,
  apiKey: string
): Promise<ListingEnrichment> => {
  const params = new URLSearchParams({
    engine: 'google_lens',
    url: imageUrl,
    api_key: apiKey,
  })

  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`)
  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`SerpAPI Google Lens failed: ${response.status} ${errText}`)
  }

  const payload = (await response.json()) as {
    visual_matches?: Array<{ title?: string; source?: string; link?: string; thumbnail?: string }>
    knowledge_graph?: { title?: string; description?: string }
    search_information?: { query_displayed?: string }
    error?: string
  }

  if (payload.error) {
    throw new Error(payload.error)
  }

  const matches = payload.visual_matches ?? []
  const titles = matches.map((match) => match.title ?? '').filter(Boolean)
  const kgTitle = payload.knowledge_graph?.title ?? ''
  const kgDescription = payload.knowledge_graph?.description ?? ''
  const bestGuess = kgTitle || titles[0] || payload.search_information?.query_displayed || ''
  const combined = [bestGuess, kgDescription, ...titles].join(' ')

  return {
    source: 'serpapi_lens',
    bestGuess,
    title: bestGuess || 'Baby product',
    description:
      kgDescription ||
      (titles.length
        ? `Similar products found: ${titles.slice(0, 4).join('; ')}.`
        : 'Google Lens reverse image search completed.'),
    category: inferCategory(combined),
    brand: inferBrand(combined),
    ageRange: inferAgeRange(combined),
    condition: 'good',
    suggestedPrice: null,
    webEntities: titles.slice(0, 12),
    similarImageUrls: matches
      .map((match) => match.thumbnail ?? '')
      .filter(Boolean)
      .slice(0, 8),
    labels: titles.slice(0, 12),
    rawSummary: combined.slice(0, 800),
  }
}

/**
 * Chooses the best available reverse-image enrichment provider.
 * @param options - Image payload and optional public URL
 */
export const enrichListingFromImage = async (options: {
  base64?: string
  imageUrl?: string
  filename?: string
}): Promise<ListingEnrichment> => {
  const visionKey = process.env.GOOGLE_VISION_API_KEY
  const serpKey = process.env.SERPAPI_KEY

  if (visionKey && options.base64) {
    try {
      return await enrichWithGoogleVision(options.base64, visionKey)
    } catch (error) {
      console.error('Vision enrichment failed', error)
    }
  }

  if (serpKey && options.imageUrl) {
    try {
      return await enrichWithSerpApiLens(options.imageUrl, serpKey)
    } catch (error) {
      console.error('SerpAPI enrichment failed', error)
    }
  }

  return buildHeuristicEnrichment([
    options.filename?.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') ?? '',
    options.imageUrl ?? '',
  ])
}
