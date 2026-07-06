import { useMemo } from 'react'
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import UserApp from './app/UserApp'
import { APP_BASE } from './app/routes'
import { Layout } from './components/Layout'
import { ReferralCapture } from './components/ReferralCapture'
import { AdminConfigProvider } from './context/AdminConfigContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { LanguagesPage } from './pages/LanguagesPage'
import { LoginPage } from './pages/LoginPage'
import { PlansPage } from './pages/PlansPage'
import { SettingsPage } from './pages/SettingsPage'
import { UsersPage } from './pages/UsersPage'
import { CommunityPage } from './pages/CommunityPage'
import { ReferralsPage } from './pages/ReferralsPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { ADMIN_BASE, ADMIN_SIGN_IN_PATH } from './routes'
import { captureReferralFromSearchParams } from './lib/referral'
import { Spinner } from './components/ui'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="center-page">
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to={ADMIN_SIGN_IN_PATH} replace />
  return <>{children}</>
}

function FallbackRedirect() {
  const [searchParams] = useSearchParams()
  useMemo(() => {
    captureReferralFromSearchParams(searchParams)
  }, [searchParams])
  return <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <>
      <ReferralCapture />
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path={`${APP_BASE}/*`} element={<UserApp />} />
      <Route path={ADMIN_SIGN_IN_PATH} element={<LoginPage />} />
      <Route
        path={ADMIN_BASE}
        element={
          <ProtectedRoute>
            <AdminConfigProvider>
              <Layout />
            </AdminConfigProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="languages" element={<LanguagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
