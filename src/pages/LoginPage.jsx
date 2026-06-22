import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', role: 'student'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isNotice = error.includes('Cek')

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
    <div className="auth-page">
      {/* Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-top">
          <div className="auth-brand-mark">RT</div>
          <span className="auth-brand-name">RunTracker</span>
        </div>

        <div>
          <h1 className="auth-brand-headline">
            Platform analitik performa lari untuk institusi pendidikan.
          </h1>
          <p className="auth-brand-sub">
            Pantau jarak, durasi, dan kecepatan setiap siswa secara akurat, lalu
            tinjau dan validasi setiap aktivitas dari satu dashboard terpusat.
          </p>

          <div className="auth-brand-stats">
            <div>
              <div className="auth-stat-value">GPS</div>
              <div className="auth-stat-label">Pelacakan akurat</div>
            </div>
            <div>
              <div className="auth-stat-value">Real-time</div>
              <div className="auth-stat-label">Review aktivitas</div>
            </div>
            <div>
              <div className="auth-stat-value">Terpusat</div>
              <div className="auth-stat-label">Data per kelas</div>
            </div>
          </div>
        </div>

        <p className="auth-brand-foot">© {new Date().getFullYear()} RunTracker · Sport Performance Platform</p>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <h2 className="text-display" style={{ marginBottom: 6 }}>
            {mode === 'login' ? 'Masuk ke akun' : 'Buat akun baru'}
          </h2>
          <p className="text-secondary" style={{ marginBottom: 28 }}>
            {mode === 'login' ? 'Lanjutkan ke dashboard RunTracker Anda.' : 'Lengkapi data untuk mulai menggunakan RunTracker.'}
          </p>

          <form onSubmit={handleSubmit} className="flex-col gap-4">
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Nama lengkap</label>
                  <input
                    className="input"
                    placeholder="cth. Andi Pratama"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Peran</label>
                  <select
                    className="select"
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="student">Siswa</option>
                    <option value="teacher">Guru</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email" placeholder="@student.sch.id"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kata sandi</label>
              <input
                className="input"
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className={`alert ${isNotice ? 'alert-success' : 'alert-danger'}`}>
                {isNotice ? '✅' : '⚠️'} <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <p className="text-secondary" style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5 }}>
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="btn-text">
              {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
