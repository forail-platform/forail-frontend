/**
 * Standalone branding bootstrap. Called from main.tsx BEFORE React mounts.
 * Applies CSS variables, document title and favicon based on a public
 * /api/v2/branding/?host=<hostname> response. Fails silently on any error.
 */

interface BrandingShape {
  tenant_id?: number
  name?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  contact_email?: string
}

const CACHE_KEY = 'forail.branding'
const TTL_MS = 5 * 60 * 1000

// L14: the branding response is served from an unauthenticated, host-keyed
// endpoint. Only apply a favicon URL that is a plain http(s) absolute URL or a
// same-origin relative path — never a javascript:/data:/other scheme.
function isSafeIconUrl(url: string): boolean {
  if (!url) return false
  // Relative path (same origin) is fine.
  if (url.startsWith('/') && !url.startsWith('//')) return true
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function apply(b: BrandingShape): void {
  if (!b) return
  if (b.primary_color) {
    document.documentElement.style.setProperty('--forail-primary', b.primary_color)
  }
  if (b.secondary_color) {
    document.documentElement.style.setProperty('--forail-secondary', b.secondary_color)
  }
  if (b.name) {
    document.title = `${b.name} — Forail`
  }
  if (b.logo_url && isSafeIconUrl(b.logo_url)) {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
    if (link) link.href = b.logo_url
  }
}

export async function applyBranding(): Promise<void> {
  // 1. Try cache first for instant paint
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as { fetchedAt?: number; branding?: BrandingShape }
      if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < TTL_MS && cached.branding) {
        apply(cached.branding)
        return
      }
    }
  } catch {
    // ignore cache errors
  }

  // 2. Fetch fresh branding (never throw)
  try {
    const host = window.location.hostname
    const res = await fetch(`/api/v2/branding/?host=${encodeURIComponent(host)}`, {
      credentials: 'omit',
    })
    if (!res.ok) return
    const branding = (await res.json()) as BrandingShape
    apply(branding)
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ fetchedAt: Date.now(), branding }),
      )
    } catch {
      // ignore storage errors (quota, privacy mode)
    }
  } catch {
    // network error, CORS, etc. — fail silently
  }
}
