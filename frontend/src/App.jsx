import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import ProtectedRoute from '@/components/common/ProtectedRoute'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import VerifyPage from '@/pages/auth/VerifyPage'
import CallbackPage from '@/pages/auth/CallbackPage'

// Dashboard pages  
import DashboardLayout from '@/components/layout/DashboardLayout'
import Overview from '@/pages/dashboard/Overview'
import Repositories from '@/pages/dashboard/Repositories'
import Documentation from '@/pages/dashboard/Documentation'
import Profile from '@/pages/dashboard/Profile' // ✅ Profile component

// Landing page
import LandingPage from '@/pages/LandingPage'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/auth/callback" element={<CallbackPage />} />

              {/* Protected Dashboard routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="repositories" element={<Repositories />} />
                <Route path="documentation" element={<Documentation />} />
                <Route path="profile" element={<Profile />} /> {/* ✅ Profile route */}
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
