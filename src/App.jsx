import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import RunTracker from './pages/RunTracker'
import TeacherDashboard from './pages/TeacherDashboard'
import ActivityDetail from './pages/ActivityDetail'

function FullScreenState({ children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: 'var(--bg)'
    }}>
      {children}
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading,signOut } = useAuth()

  if (loading) return (
    <FullScreenState>
      <span className="spinner spinner-lg" />
      <p className="text-small">Memuat...</p>
    </FullScreenState>
  )

  if (!user) return <LoginPage />

  if (!profile) return (
    <FullScreenState>
      <div className="alert alert-danger">⚠️ <span>Profile tidak ditemukan.</span></div>
      
      {/* 2. TAMBAHKAN TOMBOL INI AGAR BISA KEMBALI KE LOGIN */}
      <button 
        onClick={signOut} 
        style={{
          marginTop: 16,
          padding: '8px 16px',
          background: '#eaeaea',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Kembali ke Login (Keluar)
      </button>
    </FullScreenState>
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
