const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const extractMongoId = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^[a-f\d]{24}$/i.test(raw)) return raw
  const m = raw.match(/([a-f\d]{24})$/i)
  return m ? m[1] : ''
}

const resolveAssetUrl = (apiBaseUrl, value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  const base = String(apiBaseUrl || '').replace(/\/+$/, '')
  const normalized = raw.startsWith('/') ? raw : raw.includes('/') ? `/${raw}` : `/uploads/${raw}`
  return `${base}${normalized}`
}

const toPlainText = (value) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const truncate = (value, maxLen) => {
  const s = String(value || '').trim()
  if (!s) return ''
  const n = Number(maxLen || 0)
  if (!Number.isFinite(n) || n <= 0) return s
  if (s.length <= n) return s
  return `${s.slice(0, Math.max(0, n - 1)).trimEnd()}…`
}

const escapeAttr = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const upsertTitle = (html, title) => {
  const t = escapeAttr(title)
  if (/<title>[\s\S]*?<\/title>/i.test(html)) return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
  return html.replace(/<\/head>/i, `<title>${t}</title></head>`)
}

const upsertMetaName = (html, name, content) => {
  const n = escapeAttr(name)
  const c = escapeAttr(content)
  const re = new RegExp(`<meta\\s+[^>]*name=["']${n}["'][^>]*>`, 'i')
  const next = `<meta name="${n}" content="${c}">`
  if (re.test(html)) return html.replace(re, next)
  return html.replace(/<\/head>/i, `${next}</head>`)
}

const upsertMetaProperty = (html, property, content) => {
  const p = escapeAttr(property)
  const c = escapeAttr(content)
  const re = new RegExp(`<meta\\s+[^>]*property=["']${p}["'][^>]*>`, 'i')
  const next = `<meta property="${p}" content="${c}">`
  if (re.test(html)) return html.replace(re, next)
  return html.replace(/<\/head>/i, `${next}</head>`)
}

const upsertLinkRel = (html, rel, href) => {
  const r = escapeAttr(rel)
  const h = escapeAttr(href)
  const re = new RegExp(`<link\\s+[^>]*rel=["']${r}["'][^>]*>`, 'i')
  const next = `<link rel="${r}" href="${h}">`
  if (re.test(html)) return html.replace(re, next)
  return html.replace(/<\/head>/i, `${next}</head>`)
}

const upsertJsonLd = (html, json) => {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*data-schema=["']product["'][^>]*>[\s\S]*?<\/script>/i
  const next = `<script type="application/ld+json" data-schema="product">${JSON.stringify(json)}</script>`
  if (re.test(html)) return html.replace(re, next)
  return html.replace(/<\/head>/i, `${next}</head>`)
}

export default async function handler(req, res) {
  try {
    const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim() || 'https'
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim()
    const siteOrigin = host ? `${proto}://${host}` : ''

    const rawUrl = req.url || '/'
    const url = new URL(rawUrl, siteOrigin || 'https://example.com')
    const rawId = (url.searchParams.get('id') || url.searchParams.get('productId') || '').trim()
    const productId = extractMongoId(rawId)

    const indexRes = await fetch(`${siteOrigin}/index.html`, {
      headers: {
        'User-Agent': 'seo-bot'
      }
    })
    let html = await indexRes.text()

    if (!productId) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
      res.statusCode = 200
      res.end(html)
      return
    }

    const env = globalThis?.process?.env || {}
    const apiBaseUrl = env.VITE_API_URL || env.API_BASE_URL || 'https://api.omabhushan.com'
    const productRes = await fetch(`${String(apiBaseUrl).replace(/\/+$/, '')}/api/products/${productId}`, {
      headers: {
        Accept: 'application/json'
      }
    })
    const productJson = await productRes.json().catch(() => null)
    const productRaw = productJson && typeof productJson === 'object' ? productJson.data : null

    const name = productRaw?.name ? String(productRaw.name) : 'Product'
    const descriptionHtml = productRaw?.description ? String(productRaw.description) : ''
    const description = truncate(toPlainText(descriptionHtml) || `${name} by OM ABHUSAN JWELLARY.`, 160)

    const images = Array.isArray(productRaw?.images) ? productRaw.images : productRaw?.image ? [productRaw.image] : []
    const image = images.length ? resolveAssetUrl(apiBaseUrl, images[0]) : ''

    const slug = slugify(name) || 'product'
    const canonicalPath = `/products/${slug}_id?id=${encodeURIComponent(productId)}`
    const canonicalUrl = `${siteOrigin}${canonicalPath}`
    const title = `${name} | OM ABHUSAN JWELLARY`

    html = upsertTitle(html, title)
    html = upsertMetaName(html, 'description', description)
    html = upsertMetaName(html, 'robots', 'index,follow')
    html = upsertLinkRel(html, 'canonical', canonicalUrl)

    html = upsertMetaProperty(html, 'og:title', title)
    html = upsertMetaProperty(html, 'og:description', description)
    html = upsertMetaProperty(html, 'og:type', 'product')
    html = upsertMetaProperty(html, 'og:url', canonicalUrl)
    html = upsertMetaProperty(html, 'og:site_name', 'OM ABHUSAN JWELLARY')
    if (image) html = upsertMetaProperty(html, 'og:image', image)

    html = upsertMetaName(html, 'twitter:card', image ? 'summary_large_image' : 'summary')
    html = upsertMetaName(html, 'twitter:title', title)
    html = upsertMetaName(html, 'twitter:description', description)
    if (image) html = upsertMetaName(html, 'twitter:image', image)

    const priceInr = Number(productRaw?.attributes?.priceInr ?? productRaw?.priceInr)
    const stock = Number(productRaw?.stock)
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: truncate(toPlainText(descriptionHtml), 500) || undefined,
      image: images.map((x) => resolveAssetUrl(apiBaseUrl, x)).filter(Boolean),
      brand: { '@type': 'Brand', name: 'OM ABHUSAN JWELLARY' },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'INR',
        price: Number.isFinite(priceInr) && priceInr > 0 ? priceInr : undefined,
        availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    }

    Object.keys(schema).forEach((k) => {
      if (schema[k] === undefined) delete schema[k]
    })
    if (schema.offers) {
      Object.keys(schema.offers).forEach((k) => {
        if (schema.offers[k] === undefined) delete schema.offers[k]
      })
    }
    if (!schema.image?.length) delete schema.image

    html = upsertJsonLd(html, schema)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    res.statusCode = 200
    res.end(html)
  } catch {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('<!doctype html><html><head><meta charset="utf-8"><title>OM ABHUSAN JWELLARY</title></head><body></body></html>')
  }
}
