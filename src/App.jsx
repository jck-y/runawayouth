import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import RunTracker from './pages/RunTracker'
import TeacherDashboard from './pages/TeacherDashboard'
import ActivityDetail from './pages/ActivityDetail'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p>Memuat...</p>
    </div>
  )

  if (!user) return <LoginPage />

  if (!profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'red' }}>Profile tidak ditemukan.</p>
    </div>
  )

  if (profile.role === 'teacher') {
    return (
      <Routes>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/activity/:id" element={<ActivityDetail />} />
        <Route path="*" element={<Navigate to="/teacher" />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/track" element={<RunTracker />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}