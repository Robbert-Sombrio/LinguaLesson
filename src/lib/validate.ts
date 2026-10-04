import type { ArticleAngle, LessonContent, TeacherLesson } from '../types'

/** Thrown when the model's JSON doesn't have the shape the app needs. Safe to retry. */
export class LessonFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LessonFormatError'
  }
}

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function reqStr(o: Obj, key: string, where: string): string {
  const s = str(o[key])
  if (!s) throw new LessonFormatError(`${where}: missing "${key}"`)
  return s
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.map(str).filter(Boolean) : []
}

function objList(v: unknown): Obj[] {
  return Array.isArray(v) ? v.filter(isObj) : []
}

function atLeast<T>(list: T[], min: number, what: string): T[] {
  if (list.length < min) throw new LessonFormatError(`expected at least ${min} ${what}, got ${list.length}`)
  return list
}

// ── Student lesson ────────────────────────────────────────────────────────────
export function validateLesson(raw: unknown): LessonContent {
  if (!isObj(raw)) throw new LessonFormatError('lesson is not an object')

  // Vocabulary: the fill-in-the-blank exercise needs the word inside its example, so drop items that fail
  const vocabulary = objList(raw.vocabulary)
    .map((v) => ({
      word: str(v.word),
      pronunciation: str(v.pronunciation),
      definition: str(v.definition),
      example: str(v.example),
    }))
    .filter((v) => v.word && v.definition && v.example.toLowerCase().includes(v.word.toLowerCase()))
  atLeast(vocabulary, 4, 'usable vocabulary items')

  const comprehensionQuestions = objList(raw.comprehensionQuestions)
    .map((q) => {
      const answer = str(q.answer)
      // choices[0] must be the correct answer (the UI shuffles for display)
      const others = strList(q.choices).filter((c) => c.toLowerCase() !== answer.toLowerCase())
      const choices = answer && others.length >= 2 ? [answer, ...others].slice(0, 4) : undefined
      return { question: str(q.question), answer, choices }
    })
    .filter((q) => q.question && q.answer)
  atLeast(comprehensionQuestions, 3, 'comprehension questions')

  const g = isObj(raw.grammar) ? raw.grammar : {}
  const grammar = {
    point: reqStr(g, 'point', 'grammar'),
    explanation: reqStr(g, 'explanation', 'grammar'),
    example: str(g.example),
  }

  const lesson: LessonContent = {
    title: reqStr(raw, 'title', 'lesson'),
    summary: reqStr(raw, 'summary', 'lesson'),
    vocabulary,
    comprehensionQuestions,
    discussionPoints: atLeast(strList(raw.discussionPoints), 2, 'discussion points'),
    grammar,
  }
  const fullArticle = str(raw.fullArticle)
  if (fullArticle) lesson.fullArticle = fullArticle
  return lesson
}

// ── Teacher lesson ────────────────────────────────────────────────────────────
export function validateTeacherLesson(raw: unknown): TeacherLesson {
  if (!isObj(raw)) throw new LessonFormatError('teacher lesson is not an object')

  const vocabulary = objList(raw.vocabulary)
    .map((v) => ({ word: str(v.word), definition: str(v.definition), pronunciation: str(v.pronunciation) }))
    .filter((v) => v.word && v.definition)
  atLeast(vocabulary, 6, 'vocabulary items')

  const vocabularyExercise = objList(raw.vocabularyExercise)
    .map((e) => ({ sentence: str(e.sentence), answer: str(e.answer) }))
    .filter((e) => e.sentence && e.answer)
  atLeast(vocabularyExercise, 5, 'vocabulary exercise sentences')

  const g = isObj(raw.grammarPoint) ? raw.grammarPoint : {}
  const grammarPoint = {
    title: reqStr(g, 'title', 'grammarPoint'),
    explanation: reqStr(g, 'explanation', 'grammarPoint'),
    examples: strList(g.examples),
    activity: str(g.activity),
  }

  const rp = isObj(raw.rolePlay) ? raw.rolePlay : {}
  const rolePlay = {
    roleA: reqStr(rp, 'roleA', 'rolePlay'),
    roleB: reqStr(rp, 'roleB', 'rolePlay'),
    scenario: str(rp.scenario),
  }

  const dialogues = objList(raw.dialogues)
    .map((d) => ({
      lines: objList(d.lines)
        .map((l) => ({ speaker: str(l.speaker).toUpperCase().startsWith('B') ? ('B' as const) : ('A' as const), text: str(l.text) }))
        .filter((l) => l.text),
    }))
    .filter((d) => d.lines.length >= 4)
  atLeast(dialogues, 1, 'dialogues')

  return {
    title: reqStr(raw, 'title', 'teacher lesson'),
    warmupQuestions: atLeast(strList(raw.warmupQuestions), 3, 'warm-up questions'),
    interestingQuote: str(raw.interestingQuote),
    vocabulary,
    reading: reqStr(raw, 'reading', 'teacher lesson'),
    comprehensionQuestions: atLeast(strList(raw.comprehensionQuestions), 4, 'comprehension questions'),
    vocabularyExercise,
    grammarPoint,
    discussionQuestions: atLeast(strList(raw.discussionQuestions), 3, 'discussion questions'),
    criticalThinking: str(raw.criticalThinking),
    writingAssignment: str(raw.writingAssignment),
    rolePlay,
    dialogues,
    didYouKnow: str(raw.didYouKnow),
  }
}

// ── Angles ────────────────────────────────────────────────────────────────────
export function validateAngles(raw: unknown): ArticleAngle[] {
  const list = isObj(raw) ? objList(raw.angles) : []
  const angles = list
    .map((a) => ({ title: str(a.title), description: str(a.description), instruction: str(a.instruction) }))
    .filter((a) => a.title && a.instruction)
  return atLeast(angles, 1, 'angles')
}
