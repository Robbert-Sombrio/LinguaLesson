import type { Level, Lesson, WordBankItem, HistoryEntry } from '../types'

// Typed wrapper around chrome.storage.local
// All functions are async and safe to call from any extension context.

export const storage = {
  // ── API Keys ──────────────────────────────────────────────────────────────
  async getOpenAIKey(): Promise<string> {
    const r = await chrome.storage.local.get('openaiKey')
    return (r.openaiKey as string) ?? ''
  },
  async setOpenAIKey(key: string): Promise<void> {
    await chrome.storage.local.set({ openaiKey: key })
  },

  async getNewsApiKey(): Promise<string> {
    const r = await chrome.storage.local.get('newsApiKey')
    return (r.newsApiKey as string) ?? ''
  },
  async setNewsApiKey(key: string): Promise<void> {
    await chrome.storage.local.set({ newsApiKey: key })
  },

  // ── Preferences ──────────────────────────────────────────────────────────
  async getLevel(): Promise<Level> {
    const r = await chrome.storage.local.get('level')
    return (r.level as Level) ?? 'B2'
  },
  async setLevel(level: Level): Promise<void> {
    await chrome.storage.local.set({ level })
  },

  // ── Saved Lessons ─────────────────────────────────────────────────────────
  async getLessons(): Promise<Lesson[]> {
    const r = await chrome.storage.local.get('lessons')
    return (r.lessons as Lesson[]) ?? []
  },
  async saveLesson(lesson: Lesson): Promise<void> {
    const lessons = await this.getLessons()
    // Avoid duplicates (same article URL + level)
    const filtered = lessons.filter(
      l => !(l.article.url === lesson.article.url && l.level === lesson.level),
    )
    await chrome.storage.local.set({ lessons: [lesson, ...filtered] })
  },
  async deleteLesson(id: string): Promise<void> {
    const lessons = await this.getLessons()
    await chrome.storage.local.set({ lessons: lessons.filter(l => l.id !== id) })
  },
  async isLessonSaved(articleUrl: string, level: Level): Promise<boolean> {
    const lessons = await this.getLessons()
    return lessons.some(l => l.article.url === articleUrl && l.level === level)
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  async getOnboardingComplete(): Promise<boolean> {
    const r = await chrome.storage.local.get('onboardingComplete')
    return (r.onboardingComplete as boolean) ?? false
  },
  async setOnboardingComplete(): Promise<void> {
    await chrome.storage.local.set({ onboardingComplete: true })
  },

  // ── Lesson History (auto-saved, capped) ───────────────────────────────────
  async getHistory(): Promise<HistoryEntry[]> {
    const r = await chrome.storage.local.get('lessonHistory')
    return (r.lessonHistory as HistoryEntry[]) ?? []
  },
  async addToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<void> {
    const history = await this.getHistory()
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    // Deduplicate: same article URL + mode + level — keep the freshest
    const filtered = history.filter(
      h => !(h.article.url === entry.article.url && h.mode === entry.mode && h.level === entry.level),
    )
    await chrome.storage.local.set({ lessonHistory: [newEntry, ...filtered].slice(0, 30) })
  },
  async clearHistory(): Promise<void> {
    await chrome.storage.local.set({ lessonHistory: [] })
  },

  // ── Word Bank (Spaced Repetition) ─────────────────────────────────────────
  /** Interval ladder: after N consecutive correct answers, next review is in INTERVALS[N] days */
  _SR_INTERVALS: [1, 3, 7, 14, 30] as const,

  async getWordBank(): Promise<WordBankItem[]> {
    const r = await chrome.storage.local.get('wordBank')
    return (r.wordBank as WordBankItem[]) ?? []
  },

  /**
   * Add words the student got wrong to the bank (or reset their interval if already present).
   * Words are immediately due so the student can re-review right away.
   */
  async addWordsToBank(
    words: Pick<WordBankItem, 'word' | 'pronunciation' | 'definition' | 'example' | 'lessonTitle'>[],
  ): Promise<void> {
    const bank  = await this.getWordBank()
    const today = new Date().toISOString().slice(0, 10)
    const now   = new Date().toISOString()
    for (const w of words) {
      const i = bank.findIndex(b => b.word.toLowerCase() === w.word.toLowerCase())
      if (i === -1) {
        bank.push({ ...w, interval: 1, repetitions: 0, nextReview: today, addedAt: now })
      } else {
        // Reset interval — they've struggled with this word again
        bank[i] = { ...bank[i], ...w, interval: 1, repetitions: 0, nextReview: today }
      }
    }
    await chrome.storage.local.set({ wordBank: bank })
  },

  /**
   * Update a word's SR state after a review answer.
   * Correct → advance along the interval ladder.
   * Wrong   → reset to interval=1, due tomorrow.
   */
  async reviewWord(word: string, correct: boolean): Promise<void> {
    const bank = await this.getWordBank()
    const i    = bank.findIndex(b => b.word.toLowerCase() === word.toLowerCase())
    if (i === -1) return
    const item        = bank[i]
    const newReps     = correct ? item.repetitions + 1 : 0
    const newInterval = correct
      ? this._SR_INTERVALS[Math.min(newReps, this._SR_INTERVALS.length - 1)]
      : 1
    const next = new Date()
    next.setDate(next.getDate() + newInterval)
    bank[i] = {
      ...item,
      repetitions: newReps,
      interval:    newInterval,
      nextReview:  next.toISOString().slice(0, 10),
    }
    await chrome.storage.local.set({ wordBank: bank })
  },

  /** Words whose nextReview date is today or earlier */
  async getDueWords(): Promise<WordBankItem[]> {
    const bank  = await this.getWordBank()
    const today = new Date().toISOString().slice(0, 10)
    return bank.filter(w => w.nextReview <= today)
  },

  async getDueCount(): Promise<number> {
    return (await this.getDueWords()).length
  },
}
