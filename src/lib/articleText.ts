import { Readability } from '@mozilla/readability'

const MIN_CHARS = 400
const MAX_CHARS = 12000

export type ArticleTextSource = 'page' | 'fetched'

export interface ArticleText {
  text: string
  source: ArticleTextSource
}

/** Pull the readable body out of raw HTML, as paragraphs separated by blank lines. */
export function extractArticleText(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const parsed = new Readability(doc).parse()
  if (!parsed?.content) return null

  const body = new DOMParser().parseFromString(parsed.content, 'text/html')
  const blocks = Array.from(body.querySelectorAll('h1,h2,h3,h4,p,li,blockquote'))
    .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 0)

  const text = blocks.join('\n\n')
  if (text.length < MIN_CHARS) return null
  return clip(text)
}

/** Keep the prompt a sensible size, cutting at a paragraph boundary. */
function clip(text: string): string {
  if (text.length <= MAX_CHARS) return text
  const cut = text.lastIndexOf('\n\n', MAX_CHARS)
  return text.slice(0, cut > MAX_CHARS / 2 ? cut : MAX_CHARS)
}

function sameUrl(a: string, b: string): boolean {
  try {
    const x = new URL(a)
    const y = new URL(b)
    return x.origin + x.pathname === y.origin + y.pathname
  } catch {
    return a === b
  }
}

/** Ask the content script of the active tab for its HTML, if that tab shows `url`. */
async function fromActiveTab(url: string): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id || !tab.url || !sameUrl(tab.url, url)) return null
  try {
    const res = (await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_HTML' })) as
      | { html?: string }
      | undefined
    return res?.html ?? null
  } catch {
    return null
  }
}

/**
 * Fetch the page directly. Needs permission for that one site, which is requested
 * on demand (the Generate click is the user gesture), so the extension never holds
 * blanket access to every site.
 */
async function fromNetwork(url: string): Promise<string | null> {
  let origins: string[]
  try {
    origins = [`${new URL(url).origin}/*`]
  } catch {
    return null
  }
  try {
    const granted =
      (await chrome.permissions.contains({ origins })) ||
      (await chrome.permissions.request({ origins }))
    if (!granted) return null
    const res = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(15000) })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

/**
 * Best-effort article body for a URL. Returns null when it can't be read
 * (paywall, permission declined, not an article), so callers can fall back.
 * Call this first in a click handler: the permission prompt needs the user gesture.
 */
export async function getArticleText(url: string): Promise<ArticleText | null> {
  if (!url.startsWith('http')) return null

  const pageHtml = await fromActiveTab(url)
  const pageText = pageHtml ? extractArticleText(pageHtml) : null
  if (pageText) return { text: pageText, source: 'page' }

  const fetchedHtml = await fromNetwork(url)
  const fetchedText = fetchedHtml ? extractArticleText(fetchedHtml) : null
  return fetchedText ? { text: fetchedText, source: 'fetched' } : null
}
