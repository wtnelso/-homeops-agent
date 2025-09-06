import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import Dashboard from './components/Dashboard'
import Pricing from './components/Pricing'
import About from './components/About'
import Contact from './components/Contact'
import Login from './components/Login'
import Signup from './components/Signup'
import Privacy from './components/Privacy'
import Terms from './components/Terms'
import ProtectedRoute from './components/ProtectedRoute'
import StagingGate from './components/StagingGate'
import { ROUTES } from './config/routes'
import { AuthProvider } from './contexts/AuthContext'
import { StagingGateProvider, useStagingGate } from './contexts/StagingGateContext'
import './App.css'

const AppContent = () => {
  const { isStaging, isStagingUnlocked, unlockStaging } = useStagingGate();

  if (isStaging && !isStagingUnlocked) {
    return <StagingGate onUnlock={unlockStaging} />;
  }

  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<Landing />} />
        <Route path={ROUTES.DASHBOARD} element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.PRICING} element={<Pricing />} />
        <Route path={ROUTES.ABOUT} element={<About />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.PRIVACY} element={<Privacy />} />
        <Route path={ROUTES.TERMS} element={<Terms />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <StagingGateProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </StagingGateProvider>
  )
}

export default App