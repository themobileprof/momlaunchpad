import { GoogleOAuthProvider } from '@react-oauth/google'
import { Navigate, Route, Routes } from 'react-router-dom'
import './app.css'
import { GOOGLE_CLIENT_ID, isGoogleAuthEnabled } from './lib/googleAuth'
import { resolveBabyTheme } from './lib/babyTheme'
import { AppBackground, LoadingPage } from './components/ui'
import { UserAuthProvider, useUserAuth } from './context/UserAuthContext'
import { UserProfileProvider, useUserProfile } from './context/UserProfileContext'
import { AppHomePage } from './pages/HomePage'
import { UserLoginPage } from './pages/LoginPage'
import { UserRegisterPage } from './pages/RegisterPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ChatListPage } from './pages/ChatListPage'
import { ChatPage } from './pages/ChatPage'
import { CalendarPage } from './pages/CalendarPage'
import { CommunityPage } from './pages/CommunityPage'
import { CommunityOnboardingPage } from './pages/CommunityOnboardingPage'
import { CommunityCreatePage } from './pages/CommunityCreatePage'
import { CommunityPostPage } from './pages/CommunityPostPage'
import { CommunityNotificationsPage } from './pages/CommunityNotificationsPage'
import { InboxPage } from './pages/InboxPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { DoctorVisitsPage } from './pages/DoctorVisitsPage'
import { DoctorVisitFormPage } from './pages/DoctorVisitFormPage'
import { appPath } from './routes'

function UserGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUserAuth()
  const { profile, loading: profileLoading } = useUserProfile()

  if (authLoading) return <LoadingPage />
  if (!user) return <Navigate to={appPath('login')} replace />
  if (profileLoading) return <LoadingPage />
  if (profile && !profile.onboarding_completed) {
    return <Navigate to={appPath('onboarding')} replace />
  }
  return <>{children}</>
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUserAuth()
  const { profile, loading: profileLoading } = useUserProfile()

  if (authLoading || profileLoading) return <LoadingPage />
  if (!user) return <Navigate to={appPath('login')} replace />
  if (profile?.onboarding_completed) return <Navigate to={appPath()} replace />
  return <>{children}</>
}

function ThemedAppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile()
  return <AppBackground babyTheme={resolveBabyTheme(profile?.baby_gender)}>{children}</AppBackground>
}

function UserAppRoutes() {
  return (
    <ThemedAppShell>
      <Routes>
        <Route path="login" element={<UserLoginPage />} />
        <Route path="register" element={<UserRegisterPage />} />
        <Route
          path="onboarding"
          element={
            <OnboardingGate>
              <OnboardingPage />
            </OnboardingGate>
          }
        />
        <Route
          index
          element={
            <UserGate>
              <AppHomePage />
            </UserGate>
          }
        />
        <Route
          path="chat"
          element={
            <UserGate>
              <ChatListPage />
            </UserGate>
          }
        />
        <Route
          path="chat/:id"
          element={
            <UserGate>
              <ChatPage />
            </UserGate>
          }
        />
        <Route
          path="calendar"
          element={
            <UserGate>
              <CalendarPage />
            </UserGate>
          }
        />
        <Route
          path="community"
          element={
            <UserGate>
              <CommunityPage />
            </UserGate>
          }
        />
        <Route
          path="community/onboarding"
          element={
            <UserGate>
              <CommunityOnboardingPage />
            </UserGate>
          }
        />
        <Route
          path="community/create"
          element={
            <UserGate>
              <CommunityCreatePage />
            </UserGate>
          }
        />
        <Route
          path="community/post/:id"
          element={
            <UserGate>
              <CommunityPostPage />
            </UserGate>
          }
        />
        <Route
          path="community/notifications"
          element={
            <UserGate>
              <CommunityNotificationsPage />
            </UserGate>
          }
        />
        <Route
          path="inbox"
          element={
            <UserGate>
              <InboxPage />
            </UserGate>
          }
        />
        <Route
          path="profile"
          element={
            <UserGate>
              <ProfilePage />
            </UserGate>
          }
        />
        <Route
          path="visits"
          element={
            <UserGate>
              <DoctorVisitsPage />
            </UserGate>
          }
        />
        <Route
          path="visits/new"
          element={
            <UserGate>
              <DoctorVisitFormPage />
            </UserGate>
          }
        />
        <Route
          path="visits/:id/edit"
          element={
            <UserGate>
              <DoctorVisitFormPage />
            </UserGate>
          }
        />
        <Route
          path="settings"
          element={
            <UserGate>
              <SettingsPage />
            </UserGate>
          }
        />
        <Route path="*" element={<Navigate to={appPath()} replace />} />
      </Routes>
    </ThemedAppShell>
  )
}

export default function UserApp() {
  const inner = (
    <UserAuthProvider>
      <UserProfileProvider>
        <UserAppRoutes />
      </UserProfileProvider>
    </UserAuthProvider>
  )

  if (isGoogleAuthEnabled) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{inner}</GoogleOAuthProvider>
  }
  return inner
}
