import type { Article, ArticleAngle, Level, LessonContent, TeacherLesson } from '../types'
import { LessonFormatError, validateAngles, validateLesson, validateTeacherLesson } from './validate'

const LEVEL_DESC: Record<Level, string> = {
  B1: 'Intermediate (B1) — handles familiar work and everyday topics in clear standard English',
  B2: 'Upper Intermediate (B2) — understands complex texts, expresses themselves clearly',
  C1: 'Advanced (C1) — expresses ideas fluently with precise vocabulary',
  C2: 'Proficient (C2) — near-native range; notices subtle shades of meaning, tone and register',
}

// What "this level" means in practice, so the model pitches language correctly
const LEVEL_GUIDE: Record<Level, string> = {
  B1: 'Short, clear sentences (about 15 words on average). Common vocabulary; at most one or two idioms, each easy to infer from context. Simple tenses plus present perfect and first conditional. Vocabulary should be useful, high-frequency work English.',
  B2: 'Natural, fluent prose. Include phrasal verbs, collocations and a couple of common idioms. Passive, reported speech and second/third conditionals are fine. Vocabulary should stretch the learner slightly beyond everyday work English.',
  C1: 'Rich, precise language. Use hedging, nuance and implied meaning; vary register. Complex structures (inversion, cleft sentences, participle clauses) are fine. Vocabulary should be precise collocations and less obvious verbs and adjectives, not just "harder" words.',
  C2: 'Sophisticated, near-native prose. Use irony, understatement, idiom, rhetorical devices and deliberate stylistic choices. Vocabulary should focus on subtle distinctions between near-synonyms, register and tone.',
}

// Words an article is typically written at, by level (used when we write the article)
const ARTICLE_WORDS: Record<Level, string> = {
  B1: '300-380',
  B2: '420-520',
  C1: '480-580',
  C2: '520-620',
}

// Sean's voice and quality bar, applied to every prompt
const AUDIENCE_AND_VOICE = `Audience: busy professionals (lawyers, managers, engineers, diplomats, doctors, executives) who work in English. They are smart and experienced. What holds them back is confidence and nuance, not grammar rules.
Voice: direct, warm, sophisticated but approachable. Short, specific sentences and real-world examples. Sound like a sharp, friendly colleague, never like a textbook or a manual. Never talk down to the learner, and do not explain basic words they would know from their own language (cognates such as "strategy" or "information").
Avoid overused AI words and phrases: delve, tapestry, landscape (figurative), realm, leverage, unlock, navigate (figurative), foster, crucial, pivotal, testament, game-changer, "in today's fast-paced world", "it's important to note", "dive into".
Accuracy: never invent facts, figures, quotes, names or events. Use only what the source supports.
Sensitive topics: do not steer discussion toward politics, religion or sex. If the source is about one of these, keep the questions on the business, language or human angle.`

// Shared fields returned by both prompts
const BASE_JSON_SCHEMA = (level: Level) => `
  "title": "Engaging lesson/article title",
  "summary": "A 2-3 sentence overview written at ${level} level",
  "vocabulary": [
    {
      "word": "word or phrase",
      "pronunciation": "syllable-broken with the PRIMARY stressed syllable in ALL CAPS — verify each word carefully, e.g. 'IN-no-va-tive' (not in-NOV-a-tive), 'STRA-te-gy', 'REV-e-nue', 'phi-LAN-thro-py', 'en-tre-pre-NEUR', 'col-LAB-o-rate'",
      "definition": "plain-English definition at ${level}, max 20 words; note if the word is formal, informal or industry-specific",
      "example": "a natural sentence about a realistic work or real-life situation that MUST contain the word verbatim"
    }
  ],
  "comprehensionQuestions": [
    {
      "question": "comprehension question",
      "answer": "correct answer — one concise sentence, max 15 words",
      "choices": [
        "Correct answer — identical wording to the answer field above",
        "Plausible but incorrect option (max 15 words)",
        "Plausible but incorrect option (max 15 words)",
        "Plausible but incorrect option (max 15 words)"
      ]
    }
  ],
  "discussionPoints": ["speaking prompt 1", "speaking prompt 2", "speaking prompt 3"],
  "grammar": {
    "point": "specific grammar structure highlighted in the lesson",
    "explanation": "max 3 short sentences, ${level}-appropriate, no jargon",
    "example": "natural example sentence, ideally taken from the text"
  }`

// Topic-based lessons also include a full article
const TOPIC_JSON_SCHEMA = (level: Level) => `{
${BASE_JSON_SCHEMA(level)},
  "fullArticle": "A full original article of ${ARTICLE_WORDS[level]} words, written at ${level} level like a good journalist at a quality publication. Multiple paragraphs separated by newlines."
}`

// Article-based lessons omit fullArticle
const ARTICLE_JSON_SCHEMA = (level: Level) => `{
${BASE_JSON_SCHEMA(level)}
}`

const SHARED_REQUIREMENTS = (level: Level) =>
  `- Level guide for ${level}: ${LEVEL_GUIDE[level]}
- Exactly 6 vocabulary items, 4 comprehension questions (each with exactly 4 choices, choices[0] = correct answer), 3 discussion points
- Vocabulary: choose collocations, phrasal verbs, idioms and precise verbs or adjectives a professional would really use in meetings, emails and calls. Skip words that are too basic or easy cognates. Definitions in plain English; no circular definitions
- CRITICAL: Each vocabulary "example" sentence MUST contain the exact "word" value verbatim so fill-in-the-blank exercises work
- CRITICAL: Each vocabulary "pronunciation" MUST use hyphens between every syllable with the SINGLE PRIMARY-stressed syllable in ALL CAPS — double-check stress before writing, e.g. "IN-no-va-tive" (NOT "in-NOV-a-tive"), "STRA-te-gy", "REV-e-nue", "phi-LAN-thro-py", "en-tre-pre-NEUR", "col-LAB-o-rate", "ac-KNOWL-edge"
- Comprehension questions: two on key details, one that needs inference, one on what the writer implies or why it matters. Wrong choices must be plausible, not silly
- Discussion points are speaking prompts: ask the learner to take a position or draw on their own professional experience ("Has this happened in your industry?", "Would you push back, and how?"). Open-ended, never yes/no
- Grammar: one structure that really appears in the text, explained briefly. Speaking confidence matters more than rules
- Keep every item level-appropriate, a little challenging, and worth a busy professional's time
- Return ONLY valid JSON, no markdown, no extra text`

// ── OpenAI call: timeout, retries with backoff, readable errors, output validation ──
const MAX_ATTEMPTS = 3

class OpenAIHttpError extends Error {
  status: number
  retryable: boolean
  retryAfterMs?: number

  constructor(message: string, status: number, retryable: boolean, retryAfterMs?: number) {
    super(message)
    this.name = 'OpenAIHttpError'
    this.status = status
    this.retryable = retryable
    this.retryAfterMs = retryAfterMs
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function describeHttpError(response: Response): Promise<OpenAIHttpError> {
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string; code?: string } }
  const apiMessage = body.error?.message
  const { status } = response

  if (status === 401) {
    return new OpenAIHttpError('OpenAI rejected your API key. Check it in Settings.', status, false)
  }
  if (status === 429 && body.error?.code === 'insufficient_quota') {
    return new OpenAIHttpError('Your OpenAI account is out of credit. Add billing at platform.openai.com, then try again.', status, false)
  }
  if (status === 429) {
    const header = Number(response.headers.get('retry-after'))
    return new OpenAIHttpError('OpenAI is rate-limiting requests. Wait a moment and try again.', status, true, header > 0 ? header * 1000 : undefined)
  }
  if (status >= 500) {
    return new OpenAIHttpError('OpenAI is having trouble right now. Try again in a minute.', status, true)
  }
  return new OpenAIHttpError(apiMessage ?? `OpenAI error ${status}`, status, false)
}

async function callOpenAIRaw<T>(
  prompt: string,
  apiKey: string,
  validate: (raw: unknown) => T,
  { temperature = 0.7, timeoutMs = 90_000 }: { temperature?: number; timeoutMs?: number } = {},
): Promise<T> {
  let lastError: Error = new Error('OpenAI request failed')

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let waitMs = 1000 * 2 ** (attempt - 1)
    try {
      let response: Response
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (e) {
        const timedOut = (e as Error).name === 'TimeoutError'
        throw new OpenAIHttpError(
          timedOut ? 'OpenAI took too long to answer. Try again.' : 'Could not reach OpenAI. Check your internet connection.',
          0,
          true,
        )
      }

      if (!response.ok) throw await describeHttpError(response)

      const data = (await response.json()) as { choices?: { message?: { content?: string }; finish_reason?: string }[] }
      const choice = data.choices?.[0]
      const raw = choice?.message?.content
      if (!raw) throw new LessonFormatError('empty response')
      if (choice?.finish_reason === 'length') throw new LessonFormatError('response was cut off')

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new LessonFormatError('response was not valid JSON')
      }
      return validate(parsed)
    } catch (e) {
      lastError = e as Error
      if (e instanceof OpenAIHttpError) {
        if (!e.retryable) throw e
        if (e.retryAfterMs) waitMs = Math.min(e.retryAfterMs, 20_000)
      } else if (!(e instanceof LessonFormatError)) {
        throw e
      }
      if (attempt < MAX_ATTEMPTS) await sleep(waitMs)
    }
  }

  if (lastError instanceof LessonFormatError) {
    throw new Error("The AI's answer wasn't in the right format, even after retrying. Please try again.")
  }
  throw lastError
}

function callOpenAI(prompt: string, apiKey: string): Promise<LessonContent> {
  return callOpenAIRaw(prompt, apiKey, validateLesson)
}

// ── Article-based lesson ──────────────────────────────────────────────────────
export async function generateLesson(
  article: Article,
  level: Level,
  apiKey: string,
  articleText?: string | null,
): Promise<LessonContent> {
  // Without the real text the model can only see the headline, so it must not invent details.
  const source = articleText
    ? `Article text (the single source of truth for this lesson):
"""
${articleText}
"""`
    : `Only the headline and description are available — the article text could not be read.
Do NOT invent facts, quotes or figures. Keep content to what the headline and description support, and focus on language around the topic.`
  const grounding = articleText
    ? `- Vocabulary words and phrases must appear verbatim in the article text; take the grammar point from sentences in it
- Every comprehension question must be answerable from the article text alone; do not add facts that are not in it`
    : `- Vocabulary and grammar should relate to the headline and description`

  const prompt = `You are an expert English coach for busy professionals. Create an English lesson based on the article below for a learner at this level: ${LEVEL_DESC[level]}.

${AUDIENCE_AND_VOICE}

Article Title: ${article.title}
Article Description: ${article.description || 'No description available'}
Article URL: ${article.url}

${source}

Return this JSON structure:
${ARTICLE_JSON_SCHEMA(level)}

Requirements:
${SHARED_REQUIREMENTS(level)}
${grounding}`

  return callOpenAI(prompt, apiKey)
}

// ── Fetch 3 article angles for teacher mode ───────────────────────────────────
export async function fetchArticleAngles(
  sourceText: string,
  apiKey: string,
): Promise<ArticleAngle[]> {
  const prompt = `You are an EFL teacher preparing a speaking-focused English lesson. Given the article or topic below, suggest exactly 3 distinct angles or perspectives for writing the lesson's reading text. Each angle should offer a genuinely different focus, framing, or audience perspective, grounded in what the source actually says (for example the manager's view, the customer's view, the long-term consequences). Do not invent facts.

Source:
${sourceText}

Return this JSON:
{
  "angles": [
    {
      "title": "Short catchy angle title (5-8 words)",
      "description": "One sentence: what this angle focuses on and why it's interesting for discussion.",
      "instruction": "One sentence telling the writer exactly what perspective/focus to take when writing the reading passage."
    }
  ]
}

Return ONLY valid JSON, no markdown, no extra text.`

  return callOpenAIRaw<ArticleAngle[]>(prompt, apiKey, validateAngles, { temperature: 0.8, timeoutMs: 45_000 })
}

// ── Generate a full teacher speaking lesson ───────────────────────────────────
const TEACHER_JSON_SCHEMA = `{
  "title": "Engaging lesson title",
  "warmupQuestions": [
    "Warm-up discussion question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?"
  ],
  "interestingQuote": "A striking line that actually appears in the source, with who said it if the source says so. If the source has no good line, use a short sentence from it. NEVER invent a quote or attribute words to a real person.",
  "vocabulary": [
    {
      "word": "word or phrase",
      "definition": "clear, concise definition",
      "pronunciation": "SYL-la-ble (stressed syllable in ALL CAPS, e.g. BY-zan-tine, re-LIN-quish, STRA-te-gy)"
    }
  ],
  "reading": "Reading text at the lesson level, multiple paragraphs separated by double newlines. Engaging, specific, faithful to the source facts.",
  "comprehensionQuestions": [
    "Comprehension question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?",
    "Question 6?",
    "Question 7?"
  ],
  "vocabularyExercise": [
    { "sentence": "Complete sentence with _____ where the vocabulary word goes.", "answer": "vocabulary word" }
  ],
  "grammarPoint": {
    "title": "Grammar Structure Name",
    "explanation": "Short, clear explanation for this level (max 4 sentences).",
    "examples": [
      "Original sentence → Transformed using the grammar structure",
      "Another example → Transformed"
    ],
    "activity": "Brief in-class activity instruction for the teacher (1-2 sentences)."
  },
  "discussionQuestions": [
    "Open-ended discussion question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?"
  ],
  "criticalThinking": "One open-ended challenge where students must take and defend a position, using ideas from the reading and their own professional experience.",
  "writingAssignment": "A short, practical writing task a professional would really do (an email, a short memo, a LinkedIn post, a summary for a colleague) with word count guidance for the level.",
  "rolePlay": {
    "roleA": "Role A — a realistic professional, their stake in the issue and what they want from the conversation.",
    "roleB": "Role B — a realistic professional with a different, equally reasonable stake.",
    "scenario": "1-2 sentences placing both people in a real situation that follows from the source (a meeting, a call, a decision). No theatrical or invented characters."
  },
  "dialogues": [
    {
      "lines": [
        { "speaker": "A", "text": "Complete, natural dialogue line — no blanks, fully readable." },
        { "speaker": "B", "text": "Natural response incorporating topic vocabulary naturally." }
      ]
    },
    {
      "lines": [
        { "speaker": "A", "text": "Second dialogue opening — complete sentence." },
        { "speaker": "B", "text": "Complete response." }
      ]
    }
  ],
  "didYouKnow": "One fact stated in the source (or, for a topic with no source text, one you are certain is true) that sparks curiosity. Never guess."
}`

export async function generateTeacherLesson(
  sourceText: string,
  angleInstruction: string | null,
  apiKey: string,
  level: Level = 'C1',
): Promise<TeacherLesson> {
  const focus = angleInstruction
    ? `Write the reading passage focusing on this angle: ${angleInstruction}`
    : `Rephrase and adapt the source material into a clear, engaging reading passage for ${level} English learners.`

  const prompt = `You are an expert English coach creating a speaking-focused lesson plan for a learner at this level: ${LEVEL_DESC[level]}.

${AUDIENCE_AND_VOICE}

Source material:
${sourceText}

Lesson angle: ${focus}

Return this exact JSON structure:
${TEACHER_JSON_SCHEMA}

Requirements:
- Level guide for ${level}: ${LEVEL_GUIDE[level]}
- vocabulary: exactly 10 collocations, phrasal verbs, idioms or precise words drawn directly from the reading, ones a professional would really use. Skip basic words and easy cognates
- pronunciation: syllable-broken, PRIMARY stressed syllable in ALL CAPS (e.g. BY-zan-tine, re-LIN-quish, STRA-te-gy, CRO-ny, en-TAN-gled)
- reading: ${ARTICLE_WORDS[level]} words, written at ${level} level and matching the angle instruction. Stay faithful to the facts in the source; if the source is only a topic, include only things you are certain are true
- comprehensionQuestions: exactly 7 questions that test understanding of the reading, from detail to inference
- vocabularyExercise: exactly 10 sentences (one per vocab word), each with _____ marking the blank — never give the answer away in surrounding words
- grammarPoint: one real ${level} structure that appears in the reading. Keep it brief; the lesson is about speaking
- dialogues: exactly 2 dialogues, each 8-10 lines, set in realistic workplace situations connected to the topic. COMPLETE sentences with NO blanks; natural, rehearsable as-is, weaving in vocabulary words without forcing them
- warmupQuestions: exactly 5 — easy to answer, activate real experience, spark debate
- discussionQuestions: exactly 5 — ask for opinions and professional experience, escalating in depth. Open-ended, never yes/no
- Return ONLY valid JSON, no markdown, no extra text`

  return callOpenAIRaw<TeacherLesson>(prompt, apiKey, validateTeacherLesson, { temperature: 0.8, timeoutMs: 120_000 })
}

// ── Topic-based lesson — generates a full original article on the topic ────────
export async function generateLessonFromTopic(
  topic: string,
  level: Level,
  apiKey: string,
): Promise<LessonContent> {
  const prompt = `You are an expert English coach and journalist. Create an English lesson on the topic "${topic}" for a learner at this level: ${LEVEL_DESC[level]}.

${AUDIENCE_AND_VOICE}

Your task:
1. Write a FULL ORIGINAL ARTICLE of ${ARTICLE_WORDS[level]} words about "${topic}" as if published in a quality newspaper. Use multiple paragraphs and concrete, real-world examples. Only include figures, dates, company names or events you are certain are real; otherwise describe the trend in general terms. Never invent quotes or people. No generic hypothetical scenarios.
2. Build all lesson components (vocabulary, questions, discussion, grammar) FROM that article.

Return this JSON structure:
${TOPIC_JSON_SCHEMA(level)}

Requirements:
${SHARED_REQUIREMENTS(level)}
- "fullArticle" MUST be ${ARTICLE_WORDS[level]} words, written in flowing paragraphs, factual and engaging
- "summary" should be a 2-3 sentence TL;DR of the fullArticle
- Vocabulary should come directly from the fullArticle text
- Comprehension questions must be answerable from the fullArticle`

  return callOpenAI(prompt, apiKey)
}
