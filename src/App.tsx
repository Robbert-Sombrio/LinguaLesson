import { useState, useEffect } from 'react'
import { CreatePage } from './pages/CreatePage'
import { ArticlesPage } from './pages/ArticlesPage'
import { LessonPage } from './pages/LessonPage'
import { SavedPage } from './pages/SavedPage'
import { SettingsPage } from './pages/SettingsPage'
import { ReviewPage } from './pages/ReviewPage'
import { ArticleAnglesPage } from './pages/ArticleAnglesPage'
import { TeacherLessonPage } from './pages/TeacherLessonPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { BottomNav } from './components/BottomNav'
import type { Level, TopicId, Tab, Page, Article, LessonContent, TeacherLesson, HistoryEntry } from './types'
import { storage } from './lib/storage'

export default function App() {
  const [level, setLevel]         = useState<Level>('B2')
  const [activeTab, setActiveTab] = useState<Tab>('create')
  const [page, setPage]           = useState<Page>({ name: 'create' })
  const [dueCount, setDueCount]   = useState(0)

  // Load preferences; show onboarding for first-time users
  useEffect(() => {
    storage.getLevel().then(setLevel)
    storage.getDueCount().then(setDueCount)
    storage.getOnboardingComplete().then(complete => {
      if (!complete) setPage({ name: 'onboarding' })
    })
  }, [])

  // Refresh due count whenever we return to a bottom-nav tab
  const showBottomNav = page.name === 'create' || page.name === 'review' || page.name === 'saved'
  useEffect(() => {
    if (showBottomNav) storage.getDueCount().then(setDueCount)
  }, [showBottomNav])

  function refreshDueCount() {
    storage.getDueCount().then(setDueCount)
  }

  function handleLevelChange(l: Level) {
    setLevel(l)
    storage.setLevel(l)
  }

  // Navigate and keep active tab in sync
  function navigate(p: Page) {
    setPage(p)
    if (p.name === 'create' || p.name === 'review' || p.name === 'saved') {
      setActiveTab(p.name)
    }
  }

  // Student mode: lesson generated, go to LessonPage
  function handleLessonReady(article: Article, content: LessonContent) {
    const topicId = page.name === 'articles' ? page.topicId : 'custom'
    setPage({ name: 'lesson', article, lessonContent: content, topicId } as Page)
    storage.addToHistory({ mode: 'student', article, level, lessonContent: content })
  }

  // Teacher mode: article + sourceText ready, go to ArticleAnglesPage
  function handleTeacherModeReady(article: Article, sourceText: string) {
    setPage({ name: 'teacher-angles', article, sourceText })
  }

  // Teacher mode: lesson generated from angle, go to TeacherLessonPage
  function handleTeacherLessonReady(lesson: TeacherLesson, article: Article) {
    setPage({ name: 'teacher-lesson', lesson, article })
    storage.addToHistory({ mode: 'teacher', article, teacherLesson: lesson })
  }

  // History: re-open a past lesson without regenerating
  function handleHistoryOpen(entry: HistoryEntry) {
    if (entry.mode === 'student' && entry.lessonContent) {
      setPage({ name: 'lesson', article: entry.article, lessonContent: entry.lessonContent, topicId: 'custom' } as Page)
    } else if (entry.mode === 'teacher' && entry.teacherLesson) {
      setPage({ name: 'teacher-lesson', lesson: entry.teacherLesson, article: entry.article })
    }
  }

  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">

        {page.name === 'onboarding' && (
          <OnboardingPage onComplete={() => navigate({ name: 'create' })} />
        )}

        {page.name === 'create' && (
          <CreatePage
            level={level}
            onLevelChange={handleLevelChange}
            onTopicSelect={(topicId: TopicId) => navigate({ name: 'articles', topicId })}
            onSettings={() => navigate({ name: 'settings' })}
            onLessonReady={handleLessonReady}
            onTeacherModeReady={handleTeacherModeReady}
          />
        )}

        {page.name === 'articles' && (
          <ArticlesPage
            topicId={page.topicId}
            level={level}
            onBack={() => navigate({ name: 'create' })}
            onLessonReady={handleLessonReady}
          />
        )}

        {page.name === 'lesson' && (
          <LessonPage
            article={page.article}
            lessonContent={page.lessonContent}
            level={level}
            topicId={(page as { topicId?: TopicId | 'custom' }).topicId ?? 'custom'}
            onBack={() => navigate({ name: 'create' })}
          />
        )}

        {page.name === 'teacher-angles' && (
          <ArticleAnglesPage
            article={page.article}
            sourceText={page.sourceText}
            onBack={() => navigate({ name: 'create' })}
            onTeacherLessonReady={handleTeacherLessonReady}
          />
        )}

        {page.name === 'teacher-lesson' && (
          <TeacherLessonPage
            lesson={page.lesson}
            article={page.article}
            onBack={() => navigate({ name: 'create' })}
          />
        )}

        {page.name === 'review' && (
          <ReviewPage
            onBack={() => navigate({ name: 'create' })}
            onBankUpdated={refreshDueCount}
          />
        )}

        {page.name === 'saved' && (
          <SavedPage
            onLessonOpen={(lesson) =>
              setPage({
                name: 'lesson',
                article: lesson.article,
                lessonContent: lesson.content,
                topicId: lesson.topicId,
              } as Page)
            }
            onHistoryOpen={handleHistoryOpen}
          />
        )}

        {page.name === 'settings' && (
          <SettingsPage onBack={() => navigate({ name: 'create' })} />
        )}

      </div>

      {showBottomNav && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => navigate({ name: tab })}
          reviewDueCount={dueCount}
        />
      )}
    </div>
  )
}
