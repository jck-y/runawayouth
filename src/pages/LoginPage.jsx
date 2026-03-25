import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn, signUp, profile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', role: 'student'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password)
      if (error) setError(error.message)
      // Redirect ditangani di App.jsx via profile.role
    } else {
      const { error } = await signUp(
        form.email, form.password, form.fullName, form.role
      )
      if (error) setError(error.message)
      else setError('Cek email untuk konfirmasi akun!')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f5f0', padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '2rem',
        width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          🏃 RunTracker
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          {mode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <>
              <input
                placeholder="Nama lengkap"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
                style={inputStyle}
              />
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={inputStyle}
              >
                <option value="student">Siswa</option>
                <option value="teacher">Guru</option>
              </select>
            </>
          )}
          <input
            type="email" placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required style={inputStyle}
          />
          <input
            type="password" placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required style={inputStyle}
          />
          {error && (
            <p style={{ color: error.includes('Cek') ? 'green' : 'red', fontSize: 13 }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#666' }}>
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'login' ? 'Daftar' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd',
  fontSize: 14, width: '100%', boxSizing: 'border-box'
}
const btnStyle = {
  padding: '12px', borderRadius: 8, background: '#2563eb',
  color: '#fff', border: 'none', fontWeight: 600, fontSize: 15,
  cursor: 'pointer', marginTop: 4
}