function esc(s){
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function paragraphs(text){
  return (text||'').split(/\n+/)
    .map(p=>p.trim()).filter(Boolean)
    .map(p=>'<p>'+esc(p)+'</p>').join('')
}

function render(article, lesson, level){
  const isTopicBased = article.url.startsWith('topic:')
  const sourceURL    = isTopicBased ? null : article.url

  const articleSection = lesson.fullArticle ? `
    <div class="section">
      <p class="section-heading">📖 Reading Material</p>
      <div class="article-body">${paragraphs(lesson.fullArticle)}</div>
    </div>` : ''

  const sourceLink = sourceURL
    ? `<p class="source-link">Source: <a href="${esc(sourceURL)}" target="_blank" rel="noopener">${esc(article.source.name)}</a></p>`
    : ''

  const vocabCards = lesson.vocabulary.map(v=>`
    <div class="vocab-card">
      <p class="vocab-word">${esc(v.word)}</p>
      ${v.pronunciation ? `<p class="vocab-pron">${esc(v.pronunciation)}</p>` : ''}
      <p class="vocab-def">${esc(v.definition)}</p>
      <p class="vocab-example">"${esc(v.example)}"</p>
    </div>`).join('')

  const questions = lesson.comprehensionQuestions
    .map(q=>`<li>${esc(q.question)}</li>`).join('')

  const discussion = lesson.discussionPoints
    .map((p,i)=>`<li><span class="disc-num">${i+1}.</span>${esc(p)}</li>`).join('')

  const now = new Date().toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'})

  return `
    <div class="top-bar no-print">
      <span class="brand">🌍 LinguaLesson</span>
      <div class="top-bar-actions">
        <button class="btn btn-print" id="print-btn">🖨 Print / Save as PDF</button>
      </div>
    </div>
    <div class="container">
      <div class="hero">
        <div class="badges">
          <span class="badge badge-level">${esc(level)}</span>
          <span class="badge badge-source">${esc(article.source.name)}</span>
        </div>
        <h1 class="lesson-title">${esc(lesson.title)}</h1>
        ${sourceLink}
      </div>

      ${articleSection}

      <div class="section">
        <p class="section-heading">📝 Summary</p>
        <p class="summary-text">${esc(lesson.summary)}</p>
      </div>

      <div class="section">
        <p class="section-heading">📚 Vocabulary — ${lesson.vocabulary.length} words</p>
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
        <p class="grammar-point">${esc(lesson.grammar.point)}</p>
        <p class="grammar-exp">${esc(lesson.grammar.explanation)}</p>
        <p class="grammar-example">"${esc(lesson.grammar.example)}"</p>
      </div>

      <p class="footer">Generated with LinguaLesson · ${now}</p>
    </div>`
}

// Read from chrome.storage.local (available because this page is
// part of the extension, served from chrome-extension://)
chrome.storage.local.get(['lessonExport'], function(result){
  const data = result.lessonExport
  if(!data || !data.lessonContent){
    document.getElementById('root').innerHTML =
      '<p class="error">No lesson data found. Please go back to the extension and try again.</p>'
    return
  }
  document.title = data.lessonContent.title + ' — LinguaLesson'
  document.getElementById('root').innerHTML =
    render(data.article, data.lessonContent, data.level)
  document.getElementById('print-btn')?.addEventListener('click', () => window.print())

  // Auto-open print dialog when launched from the "Save as PDF" button
  if(new URLSearchParams(location.search).get('print') === '1'){
    setTimeout(() => window.print(), 800)
  }
})
