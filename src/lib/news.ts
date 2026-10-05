import type { Article, Topic } from '../types'

const RECENT_DAYS = 14

export async function fetchArticles(topic: Topic, apiKey: string): Promise<Article[]> {
  // Search only the topic's quality publications, newest first, matching on headline/description
  const from = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString().slice(0, 10)
  const params = new URLSearchParams({
    q: topic.newsQuery,
    domains: topic.domains.join(','),
    searchIn: 'title,description',
    language: 'en',
    sortBy: 'publishedAt',
    from,
    pageSize: '30',
  })
  const url = `https://newsapi.org/v2/everything?${params}`

  const response = await fetch(url, { headers: { 'X-Api-Key': apiKey }, signal: AbortSignal.timeout(20_000) })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as { message?: string }).message ?? `NewsAPI error ${response.status}`,
    )
  }

  const data = (await response.json()) as {
    status: string
    message?: string
    articles: Article[]
  }

  if (data.status !== 'ok') {
    throw new Error(data.message ?? 'Unknown NewsAPI error')
  }

  // Drop removed items and duplicates; articles without a picture are fine (the card handles it)
  const seen = new Set<string>()
  return data.articles.filter((a) => {
    if (!a.title || a.title === '[Removed]' || !a.url) return false
    const key = a.title.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Fetch metadata for an arbitrary URL by searching NewsAPI
// Falls back gracefully if not found in the index
export async function fetchArticleByUrl(
  articleUrl: string,
  apiKey: string,
): Promise<Article | null> {
  try {
    const q = encodeURIComponent(articleUrl)
    const url = `https://newsapi.org/v2/everything?q=${q}&pageSize=5`
    const response = await fetch(url, { headers: { 'X-Api-Key': apiKey }, signal: AbortSignal.timeout(20_000) })
    if (!response.ok) return null
    const data = (await response.json()) as { articles: Article[] }
    return data.articles.find((a) => a.url === articleUrl) ?? null
  } catch {
    return null
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
