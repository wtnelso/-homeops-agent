import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Homepage1 from './components/marketing/Homepage1'
import Pricing1 from './components/marketing/Pricing1'
import HomeOpsLanding from './components/marketing/HomeOpsLanding'
import DashboardLayout from './components/DashboardLayout'
import SettingsLayout from './components/SettingsLayout'
import PricingPage from './components/marketing/PricingPage'
import About from './components/About'
import Contact from './components/Contact'
import Login from './components/Login'
import Signup from './components/Signup'
import ResetPassword from './components/ResetPassword'
import ResetPasswordConfirm from './components/ResetPasswordConfirm'
import Privacy from './components/Privacy'
import Terms from './components/Terms'
import OAuthCallback from './components/OAuthCallback'
import AuthCallback from './components/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import RouteGuard from './components/RouteGuard'
import AdminRoute from './components/AdminRoute'
import PasswordResetGuard from './components/PasswordResetGuard'
import AdminPage from './components/AdminPage'
import BetaGate from './components/BetaGate'
import StagingBanner from './components/StagingBanner'
import { ROUTES, IS_LIVE } from './config/routes'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SessionTimeoutProvider } from './contexts/SessionTimeoutProvider'
import { ToastProvider } from './contexts/ToastContext'
import { isDemoMode } from './demo/config/demoConfig'
import { demoChatService } from './demo/services/demoChatService'

// Dashboard page components
import HomePage from './components/dashboard/HomePage'
import FamilyPage from './components/dashboard/FamilyPage'
import FamilyActivitiesPage from './components/dashboard/FamilyActivitiesPage'
import FamilyContactsPage from './components/dashboard/FamilyContactsPage'
import MemoryPage from './components/dashboard/MemoryPage'
import CalendarPage from './components/dashboard/CalendarPage'
import EmailPage from './components/dashboard/EmailPage'
import OverviewPage from './components/dashboard/OverviewPage'
import AnalyticsPage from './components/dashboard/AnalyticsPage'
import ReportsPage from './components/dashboard/ReportsPage'

// Testing components
import EmailTestingPage from './components/testing/EmailTestingPage'

// Streaming test component
import StreamingTestChat from './components/ui/StreamingTestChat'

// Settings page components
import AccountSection from './components/dashboard/settings/AccountSection'
import ProfileSection from './components/dashboard/settings/ProfileSection'
import IntegrationsSection from './components/dashboard/settings/IntegrationsSection'

import './App.css'

const AppContent = () => {
  const isStaging = import.meta.env.VITE_APP_ENV === 'STAGING';
  const { userData } = useAuth();
  const isCurrentlyInDemo = isDemoMode(userData?.user?.email);

  const handleResetDemo = () => {
    demoChatService.resetDemo();
    window.location.reload();
  };

  return (
    <>
      {isStaging && (
        <StagingBanner
          isDemoMode={isCurrentlyInDemo}
          onResetDemo={isCurrentlyInDemo ? handleResetDemo : undefined}
        />
      )}
      <div style={{ marginTop: isStaging ? '40px' : '0' }}>
        <Router>
          <RouteGuard>
            <PasswordResetGuard>
              <BetaGate>
              <Routes>
              <Route path={ROUTES.HOME} element={<HomeOpsLanding />} />
              {IS_LIVE && (
                <>
                  <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallback />} />
                  <Route path={ROUTES.SUPABASE_AUTH_CALLBACK} element={<AuthCallback />} />
                  
                  {/* Dashboard routes with nested structure - all protected */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="home" element={<HomePage />} />
                    <Route path="family">
                      <Route index element={<Navigate to="members" replace />} />
                      <Route path="members" element={<FamilyPage />} />
                      <Route path="activities" element={<FamilyActivitiesPage />} />
                      <Route path="contacts" element={<FamilyContactsPage />} />
                    </Route>
                    <Route path="memory" element={<MemoryPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="email" element={<EmailPage />} />
                    <Route path="overview" element={<OverviewPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="testing" element={<EmailTestingPage />} />
                    
                    {/* Settings with nested routes */}
                    <Route path="settings" element={<SettingsLayout />}>
                      <Route path="profile" element={<ProfileSection />} />
                      <Route path="account" element={<AccountSection />} />
                      <Route path="integrations" element={<IntegrationsSection />} />
                    </Route>
                  </Route>
                  
                  {/* Admin route - requires admin privileges */}
                  <Route path={ROUTES.ADMIN} element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  } />

                  {/* Streaming test route - for testing only */}
                  <Route path={ROUTES.STREAMING_TEST} element={
                    <ProtectedRoute>
                      <StreamingTestChat />
                    </ProtectedRoute>
                  } />
                  
                  <Route path={ROUTES.PRICING} element={<PricingPage />} />
                  <Route path={ROUTES.HOME1} element={<Homepage1 />} />
                  <Route path={ROUTES.PRICING1} element={<Pricing1 />} />
                  <Route path={ROUTES.HOMEOPS_LANDING} element={<HomeOpsLanding />} />
                  <Route path={ROUTES.ABOUT} element={<About />} />
                  <Route path={ROUTES.CONTACT} element={<Contact />} />
                  <Route path={ROUTES.SIGNUP} element={<Signup />} />
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
                  <Route path={ROUTES.RESET_PASSWORD_CONFIRM} element={<ResetPasswordConfirm />} />
                  <Route path={ROUTES.PRIVACY} element={<Privacy />} />
                  <Route path={ROUTES.TERMS} element={<Terms />} />
                </>
              )}         
              </Routes>
              </BetaGate>
            </PasswordResetGuard>
          </RouteGuard>
        </Router>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <SessionTimeoutProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </SessionTimeoutProvider>
    </AuthProvider>
  )
}

export default App