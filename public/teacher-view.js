function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function paras(text) {
  return (text || '').split(/\n+/)
    .map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p)}</p>`).join('')
}

function qList(items) {
  return '<ul class="q-list">' +
    (items || []).map(q => `<li>${esc(q)}</li>`).join('') +
    '</ul>'
}

function render(lesson, article) {
  const isTopicBased = article.url.startsWith('topic:')
  const sourceLink = !isTopicBased && article.url.startsWith('http')
    ? `<p class="source-link">Source: <a href="${esc(article.url)}" target="_blank">${esc(article.source.name)}</a></p>`
    : ''

  const now = new Date().toLocaleDateString('en-GB', {year:'numeric', month:'long', day:'numeric'})

  /* Vocabulary table */
  const vocabRows = (lesson.vocabulary || []).map(v => `
    <tr>
      <td><span class="vocab-word">${esc(v.word)}</span></td>
      <td><span class="vocab-pron">${esc(v.pronunciation)}</span></td>
      <td class="vocab-def">${esc(v.definition)}</td>
    </tr>`).join('')

  /* Vocabulary exercise — shuffled word bank, no answers shown */
  const chipColors = [
    {bg:'#e0f2fe', color:'#0369a1', border:'#bae6fd'},
    {bg:'#e0e7ff', color:'#4338ca', border:'#c7d2fe'},
    {bg:'#f5f3ff', color:'#6d28d9', border:'#ddd6fe'},
    {bg:'#fef3c7', color:'#92400e', border:'#fde68a'},
  ]
  const shuffledWords = (lesson.vocabularyExercise || [])
    .map(ex => ex.answer)
    .sort(() => Math.random() - 0.5)
  const wordBankHtml =
    '<div class="word-bank"><span class="word-bank-label">Word Bank</span>' +
    shuffledWords.map((w, i) => {
      const c = chipColors[i % chipColors.length]
      return `<span class="word-chip" style="background:${c.bg};color:${c.color};border-color:${c.border}">${esc(w)}</span>`
    }).join('') +
    '</div>'

  const exItems = (lesson.vocabularyExercise || []).map(ex => {
    const parts = (ex.sentence || '').split('_____')
    const rendered = parts.map((p, i) =>
      i < parts.length - 1
        ? esc(p) + '<span class="ex-blank"></span>'
        : esc(p)
    ).join('')
    return `<li>${rendered}</li>`
  }).join('')

  /* Grammar examples */
  const grammarExs = (lesson.grammarPoint?.examples || [])
    .map(e => `<p>• ${esc(e)}</p>`).join('')

  /* Dialogues */
  const dialogueHtml = (lesson.dialogues || []).map((d, di) => {
    const lines = (d.lines || []).map(line => {
      const isA = line.speaker === 'A'
      const cleanText = (line.text || '').replace(/_{3,}/g, '')
      return `
        <div class="dialogue-line ${isA ? 'a' : 'b'}">
          <div class="speaker-badge ${isA ? 'speaker-a' : 'speaker-b'}">${esc(line.speaker)}</div>
          <div class="speech-bubble ${isA ? 'speech-a' : 'speech-b'}">${esc(cleanText)}</div>
        </div>`
    }).join('')
    return `
      <div class="dialogue-group">
        <p class="dialogue-num">Dialogue ${di + 1}</p>
        ${lines}
      </div>`
  }).join('')

  return `
    <div class="top-bar no-print">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="brand">🌍 LinguaLesson</span>
        <span class="badge-teacher">Teacher Edition</span>
      </div>
      <div class="top-actions">
        <button class="btn btn-md" id="md-btn">⬇ Markdown</button>
        <button class="btn btn-pdf" id="pdf-btn">🖨 Save as PDF</button>
      </div>
    </div>

    <div class="container">

      <!-- Title block -->
      <div class="lesson-header">
        <p class="lesson-meta">🎓 Teacher Lesson · ${esc(article.source.name)} · ${now}</p>
        <h1 class="lesson-title">${esc(lesson.title)}</h1>
        ${sourceLink}
      </div>

      <!-- 1. Warm-up Questions -->
      <div class="section">
        <p class="section-label"><span class="emoji">🔥</span> Warm-up Questions</p>
        ${qList(lesson.warmupQuestions)}
      </div>

      <!-- 2. Interesting Quote -->
      <div class="section">
        <p class="section-label"><span class="emoji">💡</span> Interesting Quote</p>
        <div class="quote-block">
          <p class="quote-text">"${esc(lesson.interestingQuote)}"</p>
        </div>
      </div>

      <!-- 3. Vocabulary -->
      <div class="section vocab-section">
        <p class="section-label"><span class="emoji">📚</span> Vocabulary — ${(lesson.vocabulary||[]).length} words</p>
        <table class="vocab-table">
          <thead>
            <tr>
              <th>Word</th>
              <th>Pronunciation</th>
              <th>Definition</th>
            </tr>
          </thead>
          <tbody>${vocabRows}</tbody>
        </table>
      </div>

      <!-- 4. Reading -->
      <div class="section reading-section">
        <p class="section-label"><span class="emoji">📖</span> Reading</p>
        <div class="reading-body">${paras(lesson.reading)}</div>
      </div>

      <!-- 5. Comprehension Questions -->
      <div class="section">
        <p class="section-label"><span class="emoji">❓</span> Comprehension Questions</p>
        ${qList(lesson.comprehensionQuestions)}
      </div>

      <!-- 6. Vocabulary Exercise -->
      <div class="section">
        <p class="section-label"><span class="emoji">✏️</span> Vocabulary Exercise — complete each sentence</p>
        ${wordBankHtml}
        <ul class="ex-list">${exItems}</ul>
      </div>

      <!-- 7. Grammar Point -->
      <div class="section">
        <p class="section-label"><span class="emoji">⚙️</span> Grammar Point</p>
        <p class="grammar-title">${esc(lesson.grammarPoint?.title)}</p>
        <p class="grammar-exp">${esc(lesson.grammarPoint?.explanation)}</p>
        ${grammarExs ? `<div class="grammar-examples">${grammarExs}</div>` : ''}
        <div class="grammar-activity">
          <strong>📋 Activity</strong>${esc(lesson.grammarPoint?.activity)}
        </div>
      </div>

      <!-- 8. Discussion Questions -->
      <div class="section">
        <p class="section-label"><span class="emoji">💬</span> Discussion Questions</p>
        ${qList(lesson.discussionQuestions)}
      </div>

      <!-- 9. Critical Thinking -->
      <div class="section">
        <p class="section-label"><span class="emoji">🧠</span> Critical Thinking</p>
        <div class="challenge-box">${esc(lesson.criticalThinking)}</div>
      </div>

      <!-- 10. Writing Assignment -->
      <div class="section">
        <p class="section-label"><span class="emoji">📝</span> Writing Assignment</p>
        <div class="essay-box">
          <p class="essay-label">Essay Prompt</p>
          <p class="essay-text">${esc(lesson.writingAssignment)}</p>
        </div>
      </div>

      <!-- 11. Role-play Scenario -->
      <div class="section">
        <p class="section-label"><span class="emoji">🎭</span> Role-play Scenario</p>
        ${lesson.rolePlay?.scenario
          ? `<div class="scenario-box"><strong>Scenario:</strong> ${esc(lesson.rolePlay.scenario)}</div>`
          : ''}
        <div class="roles-grid">
          <div class="role-box a">
            <p class="role-label">Role A</p>
            <p class="role-text">${esc(lesson.rolePlay?.roleA)}</p>
          </div>
          <div class="role-box b">
            <p class="role-label">Role B</p>
            <p class="role-text">${esc(lesson.rolePlay?.roleB)}</p>
          </div>
        </div>
      </div>

      <!-- 12. Dialogue Practice -->
      <div class="section dialogue-section">
        <p class="section-label"><span class="emoji">🗣️</span> Dialogue Practice</p>
        ${dialogueHtml}
      </div>

      <!-- 13. Did You Know? -->
      <div class="section">
        <p class="section-label"><span class="emoji">🌍</span> Did You Know?</p>
        <div class="dyk-box">${esc(lesson.didYouKnow)}</div>
      </div>

      <p class="footer no-print">Generated with LinguaLesson Teacher Edition · ${now}</p>
      <p class="footer print-only" style="display:none">Generated with LinguaLesson Teacher Edition · ${now}</p>
    </div>`
}

/* ── Markdown export ───────────────────────────────────────────────── */
function buildMarkdown(lesson, article) {
  const now = new Date().toLocaleDateString('en-GB', {year:'numeric', month:'long', day:'numeric'})
  const isTopicBased = article.url.startsWith('topic:')
  const sourceInfo = isTopicBased
    ? `**Topic:** ${article.title}`
    : `**Source:** [${article.source.name}](${article.url})`

  const numbered = (items) => (items || []).map((q, i) => `${i+1}. ${q}`).join('\n')

  const vocabTable = [
    '| Word | Pronunciation | Definition |',
    '|------|--------------|------------|',
    ...(lesson.vocabulary || []).map(v =>
      `| **${v.word}** | \`${v.pronunciation}\` | ${v.definition} |`)
  ].join('\n')

  const vocabAnswersShuffled = (lesson.vocabularyExercise || [])
    .map(ex => ex.answer)
    .sort(() => Math.random() - 0.5)
  const vocabWordBank = '**Word Bank:** ' + vocabAnswersShuffled.map(w => '`' + w + '`').join('  ·  ')
  const vocabEx = vocabWordBank + '\n\n' +
    (lesson.vocabularyExercise || [])
      .map((ex, i) => `${i+1}. ${ex.sentence.replace(/_____/g,'______')}`)
      .join('\n\n')

  const grammarExamples = (lesson.grammarPoint?.examples || [])
    .map(e => `- ${e}`).join('\n')

  const dialogues = (lesson.dialogues || []).map((d, di) => {
    const lines = (d.lines || [])
      .map(l => `**${l.speaker}:** ${(l.text || '').replace(/_{3,}/g, '')}`)
      .join('\n\n')
    return `### Dialogue ${di + 1}\n\n${lines}`
  }).join('\n\n---\n\n')

  return `# ${lesson.title}

${sourceInfo}
📅 ${now}

---

## 🔥 Warm-up Questions

${numbered(lesson.warmupQuestions)}

---

## 💡 Interesting Quote

> "${lesson.interestingQuote}"

---

## 📚 Vocabulary

${vocabTable}

---

## 📖 Reading

${(lesson.reading || '').split(/\n+/).map(p => p.trim()).filter(Boolean).join('\n\n')}

---

## ❓ Comprehension Questions

${numbered(lesson.comprehensionQuestions)}

---

## ✏️ Vocabulary Exercise

${vocabEx}

---

## ⚙️ Grammar Point

### ${lesson.grammarPoint?.title || ''}

${lesson.grammarPoint?.explanation || ''}

**Examples:**

${grammarExamples}

**Activity:** ${lesson.grammarPoint?.activity || ''}

---

## 💬 Discussion Questions

${numbered(lesson.discussionQuestions)}

---

## 🧠 Critical Thinking

${lesson.criticalThinking}

---

## 📝 Writing Assignment

**Essay Prompt:**

${lesson.writingAssignment}

---

## 🎭 Role-play Scenario

**Scenario:** ${lesson.rolePlay?.scenario || ''}

**Role A:** ${lesson.rolePlay?.roleA || ''}

**Role B:** ${lesson.rolePlay?.roleB || ''}

---

## 🗣️ Dialogue Practice

${dialogues}

---

## 🌍 Did You Know?

${lesson.didYouKnow}

---

*Generated with LinguaLesson Teacher Edition*`
}

function downloadMarkdown() {
  const data = window.__lessonData
  if (!data) return
  const md   = buildMarkdown(data.lesson, data.article)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const slug = (data.lesson.title || 'lesson').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `lingualesson-${slug}.md`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/* ── Load from storage ─────────────────────────────────────────────────── */
function showError(msg) {
  document.getElementById('root').innerHTML =
    `<p class="error">${esc(msg)}</p>`
}

try {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    showError('Chrome extension APIs unavailable. Please open this page from the LinguaLesson side panel.')
  } else {
    chrome.storage.local.get(['teacherLessonExport'], function(result) {
      if (chrome.runtime.lastError) {
        showError('Storage error: ' + chrome.runtime.lastError.message)
        return
      }
      const data = result.teacherLessonExport
      if (!data || !data.lesson) {
        showError('No teacher lesson found. Please go back to the extension and generate a lesson first.')
        return
      }
      try {
        window.__lessonData = data
        document.title = (data.lesson.title || 'Teacher Lesson') + ' — LinguaLesson'
        document.getElementById('root').innerHTML = render(data.lesson, data.article)
        document.getElementById('md-btn')?.addEventListener('click', downloadMarkdown)
        document.getElementById('pdf-btn')?.addEventListener('click', () => window.print())

        if (new URLSearchParams(location.search).get('print') === '1') {
          setTimeout(() => window.print(), 900)
        }
      } catch (renderErr) {
        showError('Error rendering lesson: ' + (renderErr.message || renderErr))
      }
    })
  }
} catch (err) {
  showError('Failed to load lesson: ' + (err.message || err))
}
