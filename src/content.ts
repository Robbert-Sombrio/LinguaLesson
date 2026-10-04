// Content script – runs in the context of every web page.
// Listens for messages from the sidebar asking for current page metadata,
// and detects whether the current page is a single article (vs. a homepage
// or category listing page).

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Full rendered HTML, so the sidebar can extract the article body (see lib/articleText.ts)
  if (message.type === 'GET_PAGE_HTML') {
    sendResponse({ html: document.documentElement.outerHTML })
    return true
  }

  if (message.type === 'GET_PAGE_META') {
    const title =
      (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content ||
      document.title || ''

    const description =
      (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content ||
      (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || ''

    const image =
      (document.querySelector('meta[property="og:image"]') as HTMLMetaElement)?.content || null

    const siteName =
      (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content ||
      new URL(window.location.href).hostname.replace(/^www\./, '')

    // ── Article detection ────────────────────────────────────────────────────
    const pathname = window.location.pathname
    const isHomepage = pathname === '/' || pathname === '' || pathname === '/index.html'

    // Strong article signals from meta tags
    const ogType = (document.querySelector('meta[property="og:type"]') as HTMLMetaElement)?.content ?? ''
    const hasPublishedTime =
      !!document.querySelector('meta[property="article:published_time"]') ||
      !!document.querySelector('meta[name="article:published_time"]') ||
      !!document.querySelector('meta[property="datePublished"]')

    // DOM signals
    const articleEls = document.querySelectorAll('article')
    const hasSingleArticleEl = articleEls.length === 1
    // A page with many <article> elements is likely a listing/feed page
    const hasManyArticleEls = articleEls.length > 3

    // URL depth – real articles usually live at a path with ≥2 segments
    const pathDepth = pathname.split('/').filter(Boolean).length

    // Combine signals: at least one strong signal + not obviously a homepage/feed
    const hasArticleSignal = ogType === 'article' || hasPublishedTime || hasSingleArticleEl
    const isArticle =
      !isHomepage &&
      !hasManyArticleEls &&
      pathDepth >= 1 &&
      hasArticleSignal

    sendResponse({ url: window.location.href, title, description, image, siteName, isArticle })
  }
  return true
})

export {}
