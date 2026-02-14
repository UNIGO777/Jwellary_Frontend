import { Link } from 'react-router-dom'
import { formatInr, formatPercentOff } from '../pages/products.data.js'

const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function ProductCard({
  product,
  variant = 'square',
  elevated = false,
  showCategory = true,
  showSoldOut = true,
  showBadge = true,
  showPercentOff = false,
  showCompareAt = false,
  showSizes = false,
  isWishlisted = false,
  onToggleWishlist,
  onQuickAdd,
  footer
}) {
  const id = String(product?.id || '')
  const isSkeleton = id.startsWith('skeleton-')
  const to = !isSkeleton && id ? `/products/${id}` : undefined

  const price = Number(product?.priceInr || 0)
  const compareAt = Number(product?.compareAtInr || 0)
  const hasCompare = Boolean(compareAt && compareAt > price)
  const percentOff = showPercentOff ? formatPercentOff(product || {}) : ''

  const Wrapper = to ? Link : 'div'
  const wrapperProps = to ? { to } : {}

  if (variant === 'tall') {
    return (
      <Wrapper {...wrapperProps} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
          {product?.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product?.name || ''}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-100" />
          )}

          {showBadge && !isSkeleton && product?.badge ? (
            <div className="absolute left-3 top-3 bg-zinc-900/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {product.badge}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-zinc-900 sm:whitespace-normal sm:overflow-visible">
              {product?.name || ' '}
            </h3>
            {showCategory ? <p className="mt-1 text-xs text-zinc-500">{product?.category || ' '}</p> : null}
          </div>
          <div className="text-right text-sm font-medium text-zinc-900">{product?.priceInr ? formatInr(product.priceInr) : ' '}</div>
        </div>
      </Wrapper>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden border border-zinc-200 bg-white transition-colors hover:border-zinc-300',
        elevated ? 'shadow-sm transition-all will-change-transform hover:-translate-y-0.5 hover:shadow-md' : ''
      )}
    >
      <Wrapper {...wrapperProps} className="group block">
        <div className="relative aspect-[1/1] overflow-hidden bg-zinc-100">
          {product?.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product?.name || ''}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : null}

          <div className="absolute left-2 top-2 flex flex-wrap items-center gap-2">
            {showSoldOut && !isSkeleton && product && !product.inStock ? (
              <span className="bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 backdrop-blur-sm">
                Sold Out
              </span>
            ) : null}

            {showBadge && !isSkeleton && product?.badge ? (
              <span className="border border-zinc-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 backdrop-blur-sm">
                {product.badge}
              </span>
            ) : null}

            {showPercentOff && hasCompare && percentOff ? (
              <span className="bg-[#2b2118] px-2.5 py-1 text-[11px] font-semibold text-white">{percentOff}</span>
            ) : null}
          </div>

          {onToggleWishlist || onQuickAdd ? (
            <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
              {onToggleWishlist ? (
                <button
                  type="button"
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full border bg-white/90 text-zinc-800 backdrop-blur hover:bg-white',
                    isWishlisted ? 'border-rose-200 text-rose-600' : 'border-zinc-200'
                  )}
                  aria-label="Wishlist"
                  onClick={(e) => {
                    e.preventDefault()
                    onToggleWishlist(product)
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} aria-hidden="true">
                    <path
                      d="M12 20.5s-7.5-4.6-9.3-9.2C1.2 7.8 3.6 5 6.6 5c1.7 0 3.2.8 4.1 2 1-1.2 2.4-2 4.1-2 3 0 5.4 2.8 3.9 6.3C19.5 15.9 12 20.5 12 20.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              ) : null}

              {onQuickAdd ? (
                <button
                  type="button"
                  disabled={!product?.inStock}
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full border bg-white/90 text-zinc-800 backdrop-blur',
                    product?.inStock ? 'border-zinc-200 hover:bg-white' : 'cursor-not-allowed border-zinc-200 text-zinc-300'
                  )}
                  aria-label="Quick add"
                  onClick={(e) => {
                    e.preventDefault()
                    if (!product?.inStock) return
                    onQuickAdd(product)
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M8 8h13l-1.1 6.2a2 2 0 0 1-2 1.6H10.1a2 2 0 0 1-2-1.6L7.2 4.8H3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex justify-between gap-4 p-3">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold uppercase tracking-wide text-zinc-900 sm:text-sm">{product?.name || ' '}</div>
            {showCategory ? <div className="mt-1 text-xs text-zinc-500">{product?.category || ' '}</div> : null}
            {showSizes && product?.hasSizes && Array.isArray(product.sizes) && product.sizes.length ? (
              <div className="mt-1 text-[11px] font-semibold text-zinc-600">
                Sizes: {product.sizes.slice(0, 4).join(', ')}
                {product.sizes.length > 4 ? ` +${product.sizes.length - 4}` : ''}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center whitespace-nowrap border border-[#2b2118]/15 bg-[#fbf7f3] px-3 py-1 text-[13px] font-bold text-[#2b2118] sm:text-sm">
              {product?.priceInr ? formatInr(product.priceInr) : ' '}
            </span>
            {showCompareAt && hasCompare ? (
              <div className="mt-1 text-xs text-zinc-500 line-through">{formatInr(compareAt)}</div>
            ) : null}
          </div>
        </div>
      </Wrapper>

      {footer ? <div className="px-3 pb-3">{footer}</div> : null}
    </div>
  )
}
