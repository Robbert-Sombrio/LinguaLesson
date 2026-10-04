// ─── English Level ────────────────────────────────────────────────────────────
export type Level = 'B1' | 'B2' | 'C1' | 'C2'

export interface LevelMeta {
  id: Level
  label: string
  sublabel: string
}

export const LEVELS: LevelMeta[] = [
  { id: 'B1', label: 'B1', sublabel: 'Intermediate' },
  { id: 'B2', label: 'B2', sublabel: 'Upper Int.' },
  { id: 'C1', label: 'C1', sublabel: 'Advanced' },
  { id: 'C2', label: 'C2', sublabel: 'Proficient' },
]

// ─── Topics ───────────────────────────────────────────────────────────────────
export type TopicId = 'business' | 'technology' | 'culture' | 'personal-growth'

export interface Topic {
  id: TopicId
  label: string
  description: string
  emoji: string
  // NewsAPI category (or null → use `everything` endpoint with query)
  newsCategory: string | null
  newsQuery: string
}

export const TOPICS: Topic[] = [
  {
    id: 'business',
    label: 'Business & Finance',
    description: 'Markets, entrepreneurship, economics',
    emoji: '💼',
    newsCategory: 'business',
    newsQuery: 'business finance markets economy',
  },
  {
    id: 'technology',
    label: 'Technology & Innovation',
    description: 'AI, startups, digital trends',
    emoji: '⚡',
    newsCategory: 'technology',
    newsQuery: 'technology AI innovation startups',
  },
  {
    id: 'culture',
    label: 'Culture & Lifestyle',
    description: 'Arts, society, travel, food',
    emoji: '🌍',
    newsCategory: 'entertainment',
    newsQuery: 'culture arts society lifestyle',
  },
  {
    id: 'personal-growth',
    label: 'Personal Development',
    description: 'Productivity, leadership, mindset',
    emoji: '✨',
    newsCategory: null,
    newsQuery: 'personal development productivity leadership mindset self-improvement',
  },
]

// ─── Articles ─────────────────────────────────────────────────────────────────
export interface Article {
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  source: { name: string }
}

// ─── Lesson ───────────────────────────────────────────────────────────────────
export interface VocabItem {
  word: string
  pronunciation: string   // syllable-broken, stressed syllable in ALL CAPS e.g. "STRA-te-gy"
  definition: string
  example: string
}

export interface ComprehensionQuestion {
  question: string
  answer: string
  /** 4 options, choices[0] is always the correct answer — shuffle before display */
  choices?: string[]
}

export interface GrammarPoint {
  point: string
  explanation: string
  example: string
}

export interface LessonContent {
  title: string
  summary: string
  fullArticle?: string          // only set for topic-based lessons
  vocabulary: VocabItem[]
  comprehensionQuestions: ComprehensionQuestion[]
  discussionPoints: string[]
  grammar: GrammarPoint
}

export interface Lesson {
  id: string
  article: Article
  level: Level
  topicId: TopicId | 'custom'
  content: LessonContent
  createdAt: string
}

// ─── Word Bank (Spaced Repetition) ────────────────────────────────────────────
export interface WordBankItem {
  word: string
  pronunciation?: string
  definition: string
  example: string
  lessonTitle: string
  /** Days between reviews — climbs the ladder [1, 3, 7, 14, 30] on each correct answer */
  interval: number
  /** Consecutive correct answers; resets to 0 on wrong */
  repetitions: number
  /** ISO date "YYYY-MM-DD" — review is due on or after this date */
  nextReview: string
  /** ISO timestamp of when the word was first added */
  addedAt: string
}

// ─── Teacher Mode ──────────────────────────────────────────────────────────────
export interface TeacherVocabItem {
  word: string
  definition: string
  pronunciation: string
}

export interface TeacherDialogueLine {
  speaker: 'A' | 'B'
  /** Text with _____ marking vocabulary blanks */
  text: string
}

export interface TeacherLesson {
  title: string
  warmupQuestions: string[]
  interestingQuote: string
  vocabulary: TeacherVocabItem[]
  reading: string
  comprehensionQuestions: string[]
  vocabularyExercise: { sentence: string; answer: string }[]
  grammarPoint: {
    title: string
    explanation: string
    examples: string[]
    activity: string
  }
  discussionQuestions: string[]
  criticalThinking: string
  writingAssignment: string
  rolePlay: { roleA: string; roleB: string; scenario: string }
  dialogues: { lines: TeacherDialogueLine[] }[]
  didYouKnow: string
}

export interface ArticleAngle {
  title: string
  description: string
  /** One-sentence instruction telling GPT what angle to take when writing the reading */
  instruction: string
}

// ─── Lesson History ───────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: string
  createdAt: string
  mode: 'student' | 'teacher'
  article: Article
  // Student mode
  level?: Level
  lessonContent?: LessonContent
  // Teacher mode
  teacherLesson?: TeacherLesson
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type Tab = 'create' | 'review' | 'saved'

export type Page =
  | { name: 'onboarding' }
  | { name: 'create' }
  | { name: 'articles'; topicId: TopicId }
  | { name: 'lesson'; article: Article; lessonContent: LessonContent; saved?: boolean }
  | { name: 'saved-lesson'; lesson: Lesson }
  | { name: 'saved' }
  | { name: 'review' }
  | { name: 'settings' }
  | { name: 'teacher-angles'; article: Article; sourceText: string }
  | { name: 'teacher-lesson'; lesson: TeacherLesson; article: Article }
