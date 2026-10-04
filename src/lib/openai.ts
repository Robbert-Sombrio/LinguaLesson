import type { Article, ArticleAngle, Level, LessonContent, TeacherLesson } from '../types'

const LEVEL_DESC: Record<Level, string> = {
  B2: 'Upper Intermediate (B2) — understands complex texts, expresses themselves clearly',
  C1: 'Advanced (C1) — expresses ideas fluently with precise vocabulary',
}

// Shared fields returned by both prompts
const BASE_JSON_SCHEMA = (level: Level) => `
  "title": "Engaging lesson/article title",
  "summary": "A 2-3 sentence overview at ${level} level",
  "vocabulary": [
    {
      "word": "word or phrase",
      "pronunciation": "syllable-broken with the PRIMARY stressed syllable in ALL CAPS — verify each word carefully, e.g. 'IN-no-va-tive' (not in-NOV-a-tive), 'STRA-te-gy', 'REV-e-nue', 'phi-LAN-thro-py', 'en-tre-pre-NEUR', 'col-LAB-o-rate'",
      "definition": "clear definition for ${level}",
      "example": "natural sentence that MUST contain the word verbatim"
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
  "discussionPoints": ["open-ended question 1", "question 2", "question 3"],
  "grammar": {
    "point": "specific grammar structure highlighted in the lesson",
    "explanation": "clear explanation for ${level}",
    "example": "natural example sentence"
  }`

// Topic-based lessons also include a full article
const TOPIC_JSON_SCHEMA = (level: Level) => `{
${BASE_JSON_SCHEMA(level)},
  "fullArticle": "A full article of 450-600 words written like a professional journalist or educator about the topic. Use multiple paragraphs separated by newlines. Make it engaging, factual and informative."
}`

// Article-based lessons omit fullArticle
const ARTICLE_JSON_SCHEMA = (level: Level) => `{
${BASE_JSON_SCHEMA(level)}
}`

const SHARED_REQUIREMENTS = (level: Level) =>
  `- Exactly 6 vocabulary items, 4 comprehension questions (each with exactly 4 choices, choices[0] = correct answer), 3 discussion points
- CRITICAL: Each vocabulary "example" sentence MUST contain the exact "word" value verbatim so fill-in-the-blank exercises work
- CRITICAL: Each vocabulary "pronunciation" MUST use hyphens between every syllable with the SINGLE PRIMARY-stressed syllable in ALL CAPS — double-check stress before writing, e.g. "IN-no-va-tive" (NOT "in-NOV-a-tive"), "STRA-te-gy", "REV-e-nue", "phi-LAN-thro-py", "en-tre-pre-NEUR", "col-LAB-o-rate", "ac-KNOWL-edge"
- All content appropriate for ${level} English learners
- Discussion points should be thought-provoking and open-ended
- Return ONLY valid JSON, no markdown, no extra text`

async function callOpenAI(prompt: string, apiKey: string): Promise<LessonContent> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ??
        `OpenAI error ${response.status}`,
    )
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] }
  const raw = data.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from OpenAI')
  return JSON.parse(raw) as LessonContent
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

  const prompt = `You are an expert English language teacher. Create a comprehensive English lesson based on the article below for a ${LEVEL_DESC[level]} learner.

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

// ── Shared raw fetch helper (returns parsed JSON of any shape) ────────────────
async function callOpenAIRaw<T>(prompt: string, apiKey: string): Promise<T> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ??
        `OpenAI error ${response.status}`,
    )
  }
  const data = (await response.json()) as { choices: { message: { content: string } }[] }
  const raw = data.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from OpenAI')
  return JSON.parse(raw) as T
}

// ── Fetch 3 article angles for teacher mode ───────────────────────────────────
export async function fetchArticleAngles(
  sourceText: string,
  apiKey: string,
): Promise<ArticleAngle[]> {
  const prompt = `You are an EFL teacher preparing a speaking-focused English lesson. Given the article or topic below, suggest exactly 3 distinct angles or perspectives for writing the lesson's reading text. Each angle should offer a genuinely different focus, framing, or audience perspective.

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

  const result = await callOpenAIRaw<{ angles: ArticleAngle[] }>(prompt, apiKey)
  return result.angles
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
  "interestingQuote": "A thought-provoking quote related to the topic (with attribution)",
  "vocabulary": [
    {
      "word": "word or phrase",
      "definition": "clear, concise definition",
      "pronunciation": "SYL-la-ble (stressed syllable in ALL CAPS, e.g. BY-zan-tine, re-LIN-quish, STRA-te-gy)"
    }
  ],
  "reading": "Full rephrased/original article text — 400-550 words, multiple paragraphs separated by double newlines. Engaging C1/C2 level prose.",
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
    "title": "Grammar Structure Name (e.g. Nominalisation, Passive Voice, Inversion)",
    "explanation": "Clear explanation for C1/C2 level learners.",
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
  "criticalThinking": "One big open-ended design or opinion challenge that requires students to synthesise multiple ideas.",
  "writingAssignment": "Essay/writing prompt with clear word count guidance (e.g. 150-300 words) and topic focus.",
  "rolePlay": {
    "roleA": "Role A — character description and their position/task in the conversation.",
    "roleB": "Role B — character description and their opposing or complementary position.",
    "scenario": "Brief 1-2 sentence scenario setup for both students."
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
  "didYouKnow": "One fascinating fact related to the topic to spark curiosity."
}`

export async function generateTeacherLesson(
  sourceText: string,
  angleInstruction: string | null,
  apiKey: string,
): Promise<TeacherLesson> {
  const focus = angleInstruction
    ? `Write the reading passage focusing on this angle: ${angleInstruction}`
    : `Rephrase and adapt the source material into a clear, engaging reading passage for C1/C2 English learners.`

  const prompt = `You are an expert EFL teacher creating a comprehensive, speaking-focused lesson plan.

Source material:
${sourceText}

Lesson angle: ${focus}

Return this exact JSON structure:
${TEACHER_JSON_SCHEMA}

Requirements:
- vocabulary: exactly 10 advanced/topic-specific words or phrases drawn directly from the reading
- pronunciation: syllable-broken, PRIMARY stressed syllable in ALL CAPS (e.g. BY-zan-tine, re-LIN-quish, STRA-te-gy, CRO-ny, en-TAN-gled)
- reading: 400-550 words, write it as a C1/C2 level article matching the angle instruction
- comprehensionQuestions: exactly 7 questions that directly test understanding of the reading
- vocabularyExercise: exactly 10 sentences (one per vocab word), each with _____ marking the blank — never give the answer away in surrounding words
- grammarPoint: choose a real C1/C2 structure from the reading (nominalisation, passives, inversion, cleft sentences, etc.)
- dialogues: exactly 2 dialogues; each 8-10 lines; write COMPLETE sentences with NO blanks — dialogues must be fully readable, natural, and rehearsable as-is, weaving in vocabulary words naturally within the conversation
- warmupQuestions: exactly 5 — activate prior knowledge and spark debate
- discussionQuestions: exactly 5 — deeper post-reading critical discussion
- Return ONLY valid JSON, no markdown, no extra text`

  return callOpenAIRaw<TeacherLesson>(prompt, apiKey)
}

// ── Topic-based lesson — generates a full original article on the topic ────────
export async function generateLessonFromTopic(
  topic: string,
  level: Level,
  apiKey: string,
): Promise<LessonContent> {
  const prompt = `You are an expert English language teacher and journalist. Create a comprehensive English lesson on the topic "${topic}" for a ${LEVEL_DESC[level]} learner.

Your task:
1. Write a FULL ORIGINAL ARTICLE of 450-600 words about "${topic}" as if published in a quality newspaper or educational magazine. Use multiple paragraphs, include real facts, statistics or examples, and write in an engaging journalistic style.
2. Build all lesson components (vocabulary, questions, discussion, grammar) FROM that article.

Return this JSON structure:
${TOPIC_JSON_SCHEMA(level)}

Requirements:
${SHARED_REQUIREMENTS(level)}
- "fullArticle" MUST be 450-600 words, written in flowing paragraphs, factual and engaging
- "summary" should be a 2-3 sentence TL;DR of the fullArticle
- Vocabulary should come directly from the fullArticle text
- Comprehension questions must be answerable from the fullArticle`

  return callOpenAI(prompt, apiKey)
}
