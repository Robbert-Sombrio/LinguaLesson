import type { Article, LessonContent, Level, TeacherLesson } from '../types'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${esc(p)}</p>`)
    .join('\n')
}

export const LESSON_PAGE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:inherit;text-decoration:none}
.top-bar{position:sticky;top:0;background:#1e3a5f;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;z-index:100;gap:12px}
.brand{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7dd3fc;flex-shrink:0}
.top-bar-actions{display:flex;gap:8px;flex-shrink:0}
.btn{border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:12px;border-radius:10px;padding:8px 16px;transition:opacity .2s}
.btn:hover{opacity:.85}
.btn-print{background:#fff;color:#1e3a5f}
.btn-close{background:rgba(255,255,255,.12);color:#fff}
.container{max-width:760px;margin:0 auto;padding:36px 24px 80px}
.hero{margin-bottom:28px}
.badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.badge{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:.04em;text-transform:uppercase}
.badge-level{background:#1e3a5f;color:#fff}
.badge-source{background:#e0f2fe;color:#0369a1}
.lesson-title{font-size:26px;font-weight:900;color:#0f172a;line-height:1.25}
.section{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:18px}
.section-heading{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:18px;display:flex;align-items:center;gap:6px}
.source-link{font-size:11px;color:#64748b;margin-top:6px}
.source-link a{color:#0369a1;text-decoration:underline}
.article-body p{margin-bottom:14px;font-size:15px;line-height:1.75;color:#334155}
.article-body p:last-child{margin-bottom:0}
.summary-text{font-size:14px;color:#334155;line-height:1.75}
.vocab-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media(max-width:520px){.vocab-grid{grid-template-columns:1fr}}
.vocab-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px}
.vocab-word{font-size:15px;font-weight:800;color:#1e3a5f;margin-bottom:2px}
.vocab-pron{font-size:11px;font-family:monospace;font-weight:600;color:#0369a1;letter-spacing:.04em;margin-bottom:4px}
.vocab-def{font-size:12px;color:#64748b;margin-bottom:6px;line-height:1.5}
.vocab-example{font-size:12px;color:#94a3b8;font-style:italic}
.q-list{list-style:none;counter-reset:qc}
.q-list li{counter-increment:qc;padding:12px 0;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;font-size:14px;color:#334155}
.q-list li:last-child{border-bottom:none;padding-bottom:0}
.q-list li::before{content:counter(qc)".";font-weight:700;color:#1e3a5f;flex-shrink:0;min-width:20px}
.disc-list{list-style:none}
.disc-list li{padding:10px 0;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;font-size:14px;color:#334155}
.disc-list li:last-child{border-bottom:none}
.disc-list li span{font-weight:700;color:#0369a1;flex-shrink:0;min-width:20px}
.grammar-point{font-size:17px;font-weight:800;color:#1e3a5f;margin-bottom:8px}
.grammar-exp{font-size:14px;color:#334155;line-height:1.65;margin-bottom:12px}
.grammar-example{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px 16px;font-size:14px;color:#0369a1;font-style:italic}
.footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0}
@media print{
  .no-print{display:none!important}
  .top-bar{position:relative;background:#1e3a5f!important}
  body{background:#fff}
  .section{page-break-inside:avoid}
}
`

export const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&display=swap" rel="stylesheet">`

function buildBody(content: LessonContent, article: Article, level: Level): string {
  const isTopicBased = article.url.startsWith('topic:')
  const sourceURL    = isTopicBased ? null : article.url
  const sourceName   = article.source.name

  const articleSection = content.fullArticle ? `
    <div class="section">
      <p class="section-heading">📖 Reading Material</p>
      <div class="article-body">${paragraphs(content.fullArticle)}</div>
    </div>` : ''

  const sourceLink = sourceURL ? `
    <p class="source-link">Source: <a href="${esc(sourceURL)}" target="_blank" rel="noopener">${esc(sourceName)}</a></p>` : ''

  const vocabCards = content.vocabulary.map(v => `
    <div class="vocab-card">
      <p class="vocab-word">${esc(v.word)}</p>
      ${v.pronunciation ? `<p class="vocab-pron">${esc(v.pronunciation)}</p>` : ''}
      <p class="vocab-def">${esc(v.definition)}</p>
      <p class="vocab-example">"${esc(v.example)}"</p>
    </div>`).join('')

  const questions = content.comprehensionQuestions.map(q => `
    <li>${esc(q.question)}</li>`).join('')

  const discussion = content.discussionPoints.map((p, i) => `
    <li><span>${i + 1}.</span>${esc(p)}</li>`).join('')

  return `
    <div class="container">
      <div class="hero">
        <div class="badges">
          <span class="badge badge-level">${esc(level)}</span>
          <span class="badge badge-source">${esc(sourceName)}</span>
        </div>
        <h1 class="lesson-title">${esc(content.title)}</h1>
        ${sourceLink}
      </div>

      ${articleSection}

      <div class="section">
        <p class="section-heading">📝 Summary</p>
        <p class="summary-text">${esc(content.summary)}</p>
      </div>

      <div class="section">
        <p class="section-heading">📚 Vocabulary (${content.vocabulary.length} words)</p>
        <div class="vocab-grid">${vocabCards}</div>
      </div>

      <div class="section">
        <p class="section-heading">🧠 Comprehension Questions</p>
        <ul class="q-list">${questions}</ul>
      </div>

      <div class="section">
        <p class="section-heading">💬 Discussion Points</p>
        <ul class="disc-list">${discussion}</ul>
      </div>

      <div class="section">
        <p class="section-heading">✏️ Grammar Focus</p>
        <p class="grammar-point">${esc(content.grammar.point)}</p>
        <p class="grammar-exp">${esc(content.grammar.explanation)}</p>
        <p class="grammar-example">"${esc(content.grammar.example)}"</p>
      </div>

      <p class="footer">Generated with LinguaLesson · ${new Date().toLocaleDateString()}</p>
    </div>`
}

// ── Generates a self-contained HTML file for download ─────────────────────────
export function buildLessonHTML(content: LessonContent, article: Article, level: Level): string {
  const body = buildBody(content, article, level)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(content.title)} — LinguaLesson</title>
  ${FONTS_LINK}
  <style>${LESSON_PAGE_CSS}</style>
</head>
<body>
  <div class="top-bar no-print">
    <span class="brand">🌍 LinguaLesson</span>
    <div class="top-bar-actions">
      <button class="btn btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
    </div>
  </div>
  ${body}
</body>
</html>`
}

// ── Download the lesson as an .html file ──────────────────────────────────────
export function downloadLessonHTML(content: LessonContent, article: Article, level: Level): void {
  const html  = buildLessonHTML(content, article, level)
  const blob  = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url   = URL.createObjectURL(blob)
  const slug  = content.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = `lingualesson-${slug}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ── Open the lesson as a full webpage in a new tab (via chrome.storage) ────────
export async function openLessonWebView(
  content: LessonContent,
  article: Article,
  level: Level,
  autoPrint = false,
): Promise<void> {
  await chrome.storage.local.set({ lessonExport: { article, lessonContent: content, level } })
  const url = chrome.runtime.getURL('lesson-view.html') + (autoPrint ? '?print=1' : '')
  // window.open works reliably from extension pages on user gestures;
  // chrome.tabs.create can fail silently from the side panel context in MV3.
  window.open(url, '_blank')
}

// ── Build a clean Markdown string for the teacher lesson ──────────────────────
export function buildTeacherMarkdown(lesson: TeacherLesson, article: Article): string {
  const isTopicBased = article.url.startsWith('topic:')
  const sourceURL    = isTopicBased ? null : article.url
  const now          = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })

  const lines: string[] = []

  // ── Header ──
  lines.push(`# ${lesson.title}`)
  lines.push('')
  lines.push(sourceURL
    ? `**Source:** [${article.source.name}](${sourceURL})`
    : `**Source:** ${article.source.name}`)
  lines.push(`**Generated:** ${now}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // ── 1. Warm-up Questions ──
  lines.push('## 🔥 1. Warm-up Questions')
  lines.push('')
  lesson.warmupQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
  lines.push('')

  // ── 2. Interesting Quote ──
  lines.push('## 💡 2. Interesting Quote')
  lines.push('')
  lines.push(`> ${lesson.interestingQuote}`)
  lines.push('')

  // ── 3. Vocabulary ──
  lines.push('## 📚 3. Vocabulary')
  lines.push('')
  lines.push('| Word | Pronunciation | Definition |')
  lines.push('|------|:-------------:|------------|')
  lesson.vocabulary.forEach(v =>
    lines.push(`| **${v.word}** | \`${v.pronunciation}\` | ${v.definition} |`))
  lines.push('')

  // ── 4. Reading ──
  lines.push('## 📖 4. Reading')
  lines.push('')
  lines.push(lesson.reading.trim())
  lines.push('')

  // ── 5. Comprehension Questions ──
  lines.push('## ❓ 5. Comprehension Questions')
  lines.push('')
  lesson.comprehensionQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
  lines.push('')

  // ── 6. Vocabulary Exercise ──
  lines.push('## ✏️ 6. Vocabulary Exercise')
  lines.push('')
  // Shuffle the answer words so students see a word bank but not which blank they fill
  const wordBankWords = [...lesson.vocabularyExercise.map(ex => ex.answer)]
    .sort(() => Math.random() - 0.5)
  lines.push('**Word Bank:** ' + wordBankWords.map(w => `\`${w}\``).join('  ·  '))
  lines.push('')
  lines.push('*Complete each sentence with the correct word:*')
  lines.push('')
  lesson.vocabularyExercise.forEach((ex, i) => {
    lines.push(`${i + 1}. ${ex.sentence}`)
    lines.push('')
  })

  // ── 7. Grammar Point ──
  lines.push('## ⚙️ 7. Grammar Point')
  lines.push('')
  lines.push(`### ${lesson.grammarPoint.title}`)
  lines.push('')
  lines.push(lesson.grammarPoint.explanation)
  lines.push('')
  if (lesson.grammarPoint.examples.length > 0) {
    lines.push('**Examples:**')
    lesson.grammarPoint.examples.forEach(ex => lines.push(`- *${ex}*`))
    lines.push('')
  }
  lines.push(`**Activity:** ${lesson.grammarPoint.activity}`)
  lines.push('')

  // ── 8. Discussion Questions ──
  lines.push('## 💬 8. Discussion Questions')
  lines.push('')
  lesson.discussionQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
  lines.push('')

  // ── 9. Critical Thinking ──
  lines.push('## 🧠 9. Critical Thinking')
  lines.push('')
  lines.push(lesson.criticalThinking)
  lines.push('')

  // ── 10. Writing Assignment ──
  lines.push('## 📝 10. Writing Assignment')
  lines.push('')
  lines.push(lesson.writingAssignment)
  lines.push('')

  // ── 11. Role-play Scenario ──
  lines.push('## 🎭 11. Role-play Scenario')
  lines.push('')
  if (lesson.rolePlay.scenario) {
    lines.push(`**Scenario:** ${lesson.rolePlay.scenario}`)
    lines.push('')
  }
  lines.push(`**Role A:** ${lesson.rolePlay.roleA}`)
  lines.push('')
  lines.push(`**Role B:** ${lesson.rolePlay.roleB}`)
  lines.push('')

  // ── 12. Dialogue Practice ──
  lines.push('## 🗣️ 12. Dialogue Practice')
  lines.push('')
  lesson.dialogues.forEach((dialogue, di) => {
    lines.push(`### Dialogue ${di + 1}`)
    lines.push('')
    dialogue.lines.forEach(line => {
      const text = line.text.replace(/_{3,}/g, '').trim()
      lines.push(`**${line.speaker}:** ${text}`)
    })
    lines.push('')
  })

  // ── 13. Did You Know? ──
  lines.push('## 🌍 13. Did You Know?')
  lines.push('')
  lines.push(lesson.didYouKnow)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('*Generated with LinguaLesson*')

  return lines.join('\n')
}

// ── Download the teacher lesson as a .md file ─────────────────────────────────
export function downloadTeacherMarkdown(lesson: TeacherLesson, article: Article): void {
  const md   = buildTeacherMarkdown(lesson, article)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const slug = lesson.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `lingualesson-teacher-${slug}.md`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ── Open the teacher lesson as a full webpage in a new tab (via chrome.storage) ─
export async function openTeacherWebView(
  lesson: TeacherLesson,
  article: Article,
  autoPrint = false,
): Promise<void> {
  await chrome.storage.local.set({ teacherLessonExport: { lesson, article } })
  const url = chrome.runtime.getURL('teacher-view.html') + (autoPrint ? '?print=1' : '')
  // window.open works reliably from extension pages on user gestures;
  // chrome.tabs.create can fail silently from the side panel context in MV3.
  window.open(url, '_blank')
}

// ── Build a self-contained HTML file for the teacher lesson ───────────────────
// Data is embedded inline so no chrome.storage bridge is needed.
export function buildTeacherHTML(lesson: TeacherLesson, article: Article): string {
  const isTopicBased = article.url.startsWith('topic:')
  const sourceLink = !isTopicBased && article.url.startsWith('http')
    ? `<p class="source-link">Source: <a href="${esc(article.url)}" target="_blank">${esc(article.source.name)}</a></p>`
    : ''
  const now = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })

  const vocabRows = lesson.vocabulary.map(v => `
    <tr>
      <td><span class="vocab-word">${esc(v.word)}</span></td>
      <td><span class="vocab-pron">${esc(v.pronunciation)}</span></td>
      <td class="vocab-def">${esc(v.definition)}</td>
    </tr>`).join('')

  const chipColors = [
    { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
    { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
    { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  ]
  const shuffledWords = [...lesson.vocabularyExercise.map(ex => ex.answer)].sort(() => Math.random() - 0.5)
  const wordBankHtml = '<div class="word-bank"><span class="word-bank-label">Word Bank</span>' +
    shuffledWords.map((w, i) => {
      const c = chipColors[i % chipColors.length]
      return `<span class="word-chip" style="background:${c.bg};color:${c.color};border-color:${c.border}">${esc(w)}</span>`
    }).join('') + '</div>'

  const exItems = lesson.vocabularyExercise.map(ex => {
    const parts = ex.sentence.split('_____')
    const rendered = parts.map((p, i) =>
      i < parts.length - 1
        ? esc(p) + '<span class="ex-blank"></span>'
        : esc(p),
    ).join('')
    return `<li>${rendered}</li>`
  }).join('')

  const grammarExs = (lesson.grammarPoint?.examples ?? []).map(e => `<p>• ${esc(e)}</p>`).join('')

  const qList = (items: string[]) =>
    '<ul class="q-list">' + items.map(q => `<li>${esc(q)}</li>`).join('') + '</ul>'

  const dialogueHtml = lesson.dialogues.map((d, di) => {
    const lines = d.lines.map(line => {
      const isA = line.speaker === 'A'
      const cleanText = line.text.replace(/_{3,}/g, '')
      return `
        <div class="dialogue-line ${isA ? 'a' : 'b'}">
          <div class="speaker-badge ${isA ? 'speaker-a' : 'speaker-b'}">${esc(line.speaker)}</div>
          <div class="speech-bubble ${isA ? 'speech-a' : 'speech-b'}">${esc(cleanText)}</div>
        </div>`
    }).join('')
    return `<div class="dialogue-group"><p class="dialogue-num">Dialogue ${di + 1}</p>${lines}</div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(lesson.title)} — LinguaLesson Teacher Edition</title>
  ${FONTS_LINK}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .top-bar { position: sticky; top: 0; background: #1e3a5f; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; z-index: 100; gap: 12px; box-shadow: 0 2px 16px rgba(0,0,0,.2); }
    .brand { font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #7dd3fc; }
    .badge-teacher { font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: #0ea5e9; color: #fff; padding: 3px 10px; border-radius: 20px; }
    .top-actions { display: flex; gap: 8px; }
    .btn { border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; border-radius: 10px; padding: 8px 16px; display: inline-flex; align-items: center; gap: 6px; transition: opacity .15s; }
    .btn:hover { opacity: .85; }
    .btn-pdf { background: #fff; color: #1e3a5f; }
    .btn-md  { background: rgba(255,255,255,.15); color: #fff; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 28px 80px; }
    .lesson-header { margin-bottom: 28px; }
    .lesson-meta { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 6px; }
    .lesson-title { font-size: 26px; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 6px; }
    .source-link { font-size: 12px; color: #64748b; }
    .source-link a { color: #0369a1; text-decoration: underline; }
    .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; margin-bottom: 16px; break-inside: avoid; }
    .section-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
    .section-label .emoji { font-size: 14px; }
    .reading-section { break-before: page; }
    .quote-block { border-left: 4px solid #1e3a5f; padding: 12px 18px; background: #f0f5ff; border-radius: 0 12px 12px 0; }
    .quote-text { font-size: 15px; font-style: italic; color: #1e293b; line-height: 1.65; }
    .q-list { list-style: none; counter-reset: qc; }
    .q-list li { counter-increment: qc; display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; line-height: 1.6; }
    .q-list li:last-child { border-bottom: none; padding-bottom: 0; }
    .q-list li::before { content: counter(qc) "."; font-weight: 800; color: #1e3a5f; flex-shrink: 0; min-width: 22px; font-size: 13px; }
    .vocab-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .vocab-table th { text-align: left; padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .vocab-table td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .vocab-table tr:last-child td { border-bottom: none; }
    .vocab-word { font-weight: 800; color: #1e3a5f; font-size: 14px; }
    .vocab-pron { font-family: monospace; font-weight: 600; color: #0369a1; font-size: 11px; letter-spacing: .04em; white-space: nowrap; }
    .vocab-def { color: #475569; line-height: 1.5; }
    .reading-body p { margin-bottom: 14px; font-size: 15px; line-height: 1.8; color: #334155; }
    .reading-body p:last-child { margin-bottom: 0; }
    .ex-list { list-style: none; counter-reset: ex; }
    .ex-list li { counter-increment: ex; display: flex; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; line-height: 1.6; }
    .ex-list li:last-child { border-bottom: none; }
    .ex-list li::before { content: counter(ex) "."; font-weight: 800; color: #1e3a5f; flex-shrink: 0; min-width: 22px; font-size: 13px; }
    .ex-blank { display: inline-block; border-bottom: 2px solid #94a3b8; min-width: 70px; height: 1.1em; vertical-align: bottom; margin: 0 3px; }
    .word-bank { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; }
    .word-bank-label { width: 100%; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 4px; }
    .word-chip { font-size: 12px; font-weight: 700; padding: 3px 12px; border-radius: 20px; border: 1px solid; }
    .grammar-title { font-size: 17px; font-weight: 900; color: #1e3a5f; margin-bottom: 8px; }
    .grammar-exp { font-size: 14px; color: #334155; line-height: 1.7; margin-bottom: 14px; }
    .grammar-examples { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px 18px; margin-bottom: 12px; }
    .grammar-examples p { font-size: 13px; color: #0369a1; font-style: italic; line-height: 1.6; margin-bottom: 6px; }
    .grammar-examples p:last-child { margin-bottom: 0; }
    .grammar-activity { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #78350f; line-height: 1.6; }
    .grammar-activity strong { font-weight: 800; display: block; margin-bottom: 4px; }
    .challenge-box { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 16px 20px; font-size: 14px; color: #4c1d95; line-height: 1.7; }
    .essay-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; }
    .essay-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #15803d; margin-bottom: 6px; }
    .essay-text { font-size: 14px; color: #166534; line-height: 1.7; }
    .scenario-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 12px; }
    .roles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .role-box { border-radius: 12px; padding: 14px 16px; }
    .role-box.a { background: #eff6ff; border: 1px solid #bfdbfe; }
    .role-box.b { background: #f0f5ff; border: 1px solid #c7d2fe; }
    .role-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
    .role-box.a .role-label { color: #1d4ed8; }
    .role-box.b .role-label { color: #4338ca; }
    .role-text { font-size: 13px; color: #334155; line-height: 1.55; }
    .dialogue-group { margin-bottom: 20px; }
    .dialogue-group:last-child { margin-bottom: 0; }
    .dialogue-num { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 10px; }
    .dialogue-line { display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start; }
    .dialogue-line.b { flex-direction: row-reverse; }
    .speaker-badge { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; flex-shrink: 0; }
    .speaker-a { background: #dbeafe; color: #1e40af; }
    .speaker-b { background: #e0e7ff; color: #3730a3; }
    .speech-bubble { max-width: 85%; border-radius: 16px; padding: 9px 14px; font-size: 13.5px; color: #1e293b; line-height: 1.55; }
    .speech-a { background: #eff6ff; border: 1px solid #dbeafe; border-top-left-radius: 4px; }
    .speech-b { background: #eef2ff; border: 1px solid #e0e7ff; border-top-right-radius: 4px; }
    .dyk-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; font-size: 14px; color: #78350f; line-height: 1.7; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    @page { margin: 18mm 18mm 20mm; }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .container { padding: 0; max-width: 100%; }
      .section { break-inside: avoid; box-shadow: none; }
      .reading-section { break-before: page; break-inside: auto; }
      .reading-body p { break-inside: avoid; }
      .vocab-section { break-before: page; break-inside: auto; }
      .dialogue-section { break-before: page; break-inside: auto; }
    }
  </style>
</head>
<body>
  <div class="top-bar no-print">
    <div style="display:flex;align-items:center;gap:10px">
      <span class="brand">🌍 LinguaLesson</span>
      <span class="badge-teacher">Teacher Edition</span>
    </div>
    <button class="btn btn-pdf" onclick="window.print()">🖨 Save as PDF</button>
  </div>
  <div class="container">
    <div class="lesson-header">
      <p class="lesson-meta">🎓 Teacher Lesson · ${esc(article.source.name)} · ${now}</p>
      <h1 class="lesson-title">${esc(lesson.title)}</h1>
      ${sourceLink}
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">🔥</span> Warm-up Questions</p>
      ${qList(lesson.warmupQuestions)}
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">💡</span> Interesting Quote</p>
      <div class="quote-block"><p class="quote-text">"${esc(lesson.interestingQuote)}"</p></div>
    </div>
    <div class="section vocab-section">
      <p class="section-label"><span class="emoji">📚</span> Vocabulary — ${lesson.vocabulary.length} words</p>
      <table class="vocab-table">
        <thead><tr><th>Word</th><th>Pronunciation</th><th>Definition</th></tr></thead>
        <tbody>${vocabRows}</tbody>
      </table>
    </div>
    <div class="section reading-section">
      <p class="section-label"><span class="emoji">📖</span> Reading</p>
      <div class="reading-body">${paragraphs(lesson.reading)}</div>
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">❓</span> Comprehension Questions</p>
      ${qList(lesson.comprehensionQuestions)}
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">✏️</span> Vocabulary Exercise — complete each sentence</p>
      ${wordBankHtml}
      <ul class="ex-list">${exItems}</ul>
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">⚙️</span> Grammar Point</p>
      <p class="grammar-title">${esc(lesson.grammarPoint?.title)}</p>
      <p class="grammar-exp">${esc(lesson.grammarPoint?.explanation)}</p>
      ${grammarExs ? `<div class="grammar-examples">${grammarExs}</div>` : ''}
      <div class="grammar-activity"><strong>📋 Activity</strong>${esc(lesson.grammarPoint?.activity)}</div>
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">💬</span> Discussion Questions</p>
      ${qList(lesson.discussionQuestions)}
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">🧠</span> Critical Thinking</p>
      <div class="challenge-box">${esc(lesson.criticalThinking)}</div>
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">📝</span> Writing Assignment</p>
      <div class="essay-box">
        <p class="essay-label">Essay Prompt</p>
        <p class="essay-text">${esc(lesson.writingAssignment)}</p>
      </div>
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">🎭</span> Role-play Scenario</p>
      ${lesson.rolePlay?.scenario ? `<div class="scenario-box"><strong>Scenario:</strong> ${esc(lesson.rolePlay.scenario)}</div>` : ''}
      <div class="roles-grid">
        <div class="role-box a"><p class="role-label">Role A</p><p class="role-text">${esc(lesson.rolePlay?.roleA)}</p></div>
        <div class="role-box b"><p class="role-label">Role B</p><p class="role-text">${esc(lesson.rolePlay?.roleB)}</p></div>
      </div>
    </div>
    <div class="section dialogue-section">
      <p class="section-label"><span class="emoji">🗣️</span> Dialogue Practice</p>
      ${dialogueHtml}
    </div>
    <div class="section">
      <p class="section-label"><span class="emoji">🌍</span> Did You Know?</p>
      <div class="dyk-box">${esc(lesson.didYouKnow)}</div>
    </div>
    <p class="footer">Generated with LinguaLesson Teacher Edition · ${now}</p>
  </div>
</body>
</html>`
}

// ── Download the teacher lesson as a self-contained .html file ────────────────
// Open in any browser → File › Print → Save as PDF
export function downloadTeacherHTML(lesson: TeacherLesson, article: Article): void {
  const html = buildTeacherHTML(lesson, article)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const slug = lesson.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `lingualesson-teacher-${slug}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
