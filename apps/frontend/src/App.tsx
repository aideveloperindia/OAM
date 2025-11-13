import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { HelpPage } from './pages/HelpPage'
import { QuoteStandardPage } from './pages/QuoteStandardPage'
import { QuoteAdvancedPage } from './pages/QuoteAdvancedPage'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { MyAttendancePage } from './pages/MyAttendancePage'
import { ClassAttendancePage } from './pages/ClassAttendancePage'
import { StudentDashboardPage } from './pages/StudentDashboardPage'
import { PredictedAbsenteesPage } from './pages/PredictedAbsenteesPage'
import { UploadStatusPage } from './pages/UploadStatusPage'
import { OfflineFallbackPage } from './pages/OfflineFallbackPage'
import splashImage from './assets/open-modal.png'

const App = () => {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      {showSplash ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm transition-opacity duration-500">
          <img
            src={splashImage}
            alt="OAM welcome screen"
            className="max-h-[70vh] max-w-[90vw] rounded-3xl shadow-2xl"
          />
        </div>
      ) : null}

      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="quote-standard" element={<QuoteStandardPage />} />
            <Route path="quote-advanced" element={<QuoteAdvancedPage />} />
            <Route path="app/login" element={<LoginPage />} />
          </Route>

          <Route path="/offline" element={<OfflineFallbackPage />} />

          <Route
            path="app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="my-attendance" replace />} />
            <Route path="my-attendance" element={<MyAttendancePage />} />
            <Route path="class-attendance" element={<ClassAttendancePage />} />
            <Route path="student/dashboard" element={<StudentDashboardPage />} />
            <Route path="predicted-absentees" element={<PredictedAbsenteesPage />} />
            <Route path="upload-status" element={<UploadStatusPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
