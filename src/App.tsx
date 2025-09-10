import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import DashboardLayout from './components/DashboardLayout'
import SettingsLayout from './components/SettingsLayout'
import Onboarding from './components/Onboarding'
import Pricing from './components/Pricing'
import About from './components/About'
import Contact from './components/Contact'
import Login from './components/Login'
import Signup from './components/Signup'
import ResetPassword from './components/ResetPassword'
import Privacy from './components/Privacy'
import Terms from './components/Terms'
import OAuthCallback from './components/OAuthCallback'
import AuthCallback from './components/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import RouteGuard from './components/RouteGuard'
import AdminRoute from './components/AdminRoute'
import AdminPage from './components/AdminPage'
import BetaGate from './components/BetaGate'
import StagingBanner from './components/StagingBanner'
import { ROUTES, IS_LIVE } from './config/routes'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

// Dashboard page components
import HomePage from './components/dashboard/HomePage'
import CalendarPage from './components/dashboard/CalendarPage'
import EmailPage from './components/dashboard/EmailPage'
import OverviewPage from './components/dashboard/OverviewPage'
import AnalyticsPage from './components/dashboard/AnalyticsPage'
import ReportsPage from './components/dashboard/ReportsPage'

// Settings page components
import ProfileSection from './components/dashboard/settings/ProfileSection'
import AccountSection from './components/dashboard/settings/AccountSection'
import IntegrationsSection from './components/dashboard/settings/IntegrationsSection'

import './App.css'

const AppContent = () => {
  const isStaging = import.meta.env.VITE_APP_ENV === 'STAGING';
  
  return (
    <>
      {isStaging && <StagingBanner />}
      <div style={{ marginTop: isStaging ? '40px' : '0' }}>
        <Router>
          <RouteGuard>
            <BetaGate>
              <Routes>
              <Route path={ROUTES.HOME} element={<Landing />} />
              {IS_LIVE && (
                <>
                  <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallback />} />
                  <Route path={ROUTES.SUPABASE_AUTH_CALLBACK} element={<AuthCallback />} />
                  
                  {/* Onboarding flow - protected but special handling */}
                  <Route path={ROUTES.ONBOARDING} element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } />
                  
                  {/* Dashboard routes with nested structure - all protected */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="home" element={<HomePage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="email" element={<EmailPage />} />
                    <Route path="overview" element={<OverviewPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    
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
                  
                  <Route path={ROUTES.PRICING} element={<Pricing />} />
                  <Route path={ROUTES.ABOUT} element={<About />} />
                  <Route path={ROUTES.CONTACT} element={<Contact />} />
                  <Route path={ROUTES.SIGNUP} element={<Signup />} />
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
                  <Route path={ROUTES.PRIVACY} element={<Privacy />} />
                  <Route path={ROUTES.TERMS} element={<Terms />} />
                </>
              )}         
              </Routes>
            </BetaGate>
          </RouteGuard>
        </Router>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App