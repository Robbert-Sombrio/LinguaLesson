import type { Article, Topic } from '../types'

export async function fetchArticles(topic: Topic, apiKey: string): Promise<Article[]> {
  let url: string

  if (topic.newsCategory) {
    // Use top-headlines by category for business / technology / entertainment
    url =
      `https://newsapi.org/v2/top-headlines` +
      `?category=${topic.newsCategory}&language=en&pageSize=15&apiKey=${apiKey}`
  } else {
    // Use /everything with a keyword query for personal-growth etc.
    const q = encodeURIComponent(topic.newsQuery)
    url =
      `https://newsapi.org/v2/everything` +
      `?q=${q}&language=en&sortBy=publishedAt&pageSize=15&apiKey=${apiKey}`
  }

  const response = await fetch(url)

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

  // Filter out articles without images or titles
  return data.articles.filter(
    (a) => a.urlToImage && a.title && a.title !== '[Removed]',
  )
}

// Fetch metadata for an arbitrary URL by searching NewsAPI
// Falls back gracefully if not found in the index
export async function fetchArticleByUrl(
  articleUrl: string,
  apiKey: string,
): Promise<Article | null> {
  try {
    const q = encodeURIComponent(articleUrl)
    const url = `https://newsapi.org/v2/everything?q=${q}&pageSize=5&apiKey=${apiKey}`
    const response = await fetch(url)
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
