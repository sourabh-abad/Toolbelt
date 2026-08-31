import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { seoFor, canonicalUrl } from './seo'

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [key, val] = selector.replace(/[[\]"]/g, '').split('=')
    el.setAttribute(key.replace('meta', '').trim() || 'name', val)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/**
 * Keeps <title>, the meta description, canonical URL and social tags in sync
 * with the current route. The static HTML for each route already carries the
 * correct tags for crawlers; this handles client-side navigation.
 */
export function useSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = seoFor(pathname)
    const url = canonicalUrl(pathname)

    document.title = seo.title
    setMeta('meta[name="description"]', 'content', seo.description)
    setMeta('meta[property="og:title"]', 'content', seo.title)
    setMeta('meta[property="og:description"]', 'content', seo.description)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[name="twitter:title"]', 'content', seo.title)
    setMeta('meta[name="twitter:description"]', 'content', seo.description)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }, [pathname])
}
