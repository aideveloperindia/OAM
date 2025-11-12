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

const App = () => {
  return (
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
  )
}

export default App
