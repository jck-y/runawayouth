import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useLocationPermission } from '../hooks/useLocationPermission'
import LocationPermissionModal from '../components/LocationPermissionModal'

const STATUS_STYLE = {
  submitted: { bg: '#fef3c7', color: '#92400e', label: 'Menunggu review' },
  approved:  { bg: '#d1fae5', color: '#065f46', label: 'Disetujui' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Ditolak' },
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const { permissionStatus, requestPermission } = useLocationPermission()

  // Tampilkan modal jika izin belum diberikan dan belum pernah ditolak
  useEffect(() => {
    if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
      // Delay sedikit agar dashboard muncul dulu sebelum popup
      const timer = setTimeout(() => setShowLocationModal(true), 800)
      return () => clearTimeout(timer)
    }
  }, [permissionStatus])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
      setActivities(data || [])
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  const handleAllowLocation = async () => {
    setRequesting(true)
    const result = await requestPermission()
    setRequesting(false)
    setShowLocationModal(false)

    if (result === 'denied') {
      alert('Izin lokasi ditolak. Kamu bisa mengaktifkannya melalui pengaturan browser.')
    }
  }

  const totalKm = activities
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.distance_meters / 1000, 0)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem', minHeight: '100vh' }}>

      {/* Modal izin lokasi */}
      {showLocationModal && (
        <LocationPermissionModal
          onAllow={handleAllowLocation}
          onSkip={() => setShowLocationModal(false)}
          loading={requesting}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Halo, {profile?.full_name} 👋</h1>
          <p style={{ fontSize: 13, color: '#666' }}>Siswa · {profile?.class_name || 'Kelas belum diset'}</p>
        </div>
        <button onClick={signOut} style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>
          Keluar
        </button>
      </div>

      {/* Banner jika GPS ditolak */}
      {permissionStatus === 'denied' && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12,
          padding: '0.75rem 1rem', marginBottom: 16, fontSize: 13, color: '#92400e'
        }}>
          ⚠️ Izin GPS ditolak. Buka <strong>Pengaturan Browser → Izin Situs</strong> untuk mengaktifkan lokasi.
        </div>
      )}

      {/* Indikator status GPS */}
      {permissionStatus === 'granted' && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
          padding: '0.5rem 1rem', marginBottom: 16, fontSize: 12, color: '#166534',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ fontSize: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block', width: 8, height: 8 }} />
          GPS siap digunakan
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatCard label="Total km" value={totalKm.toFixed(1)} />
        <StatCard label="Aktivitas" value={activities.length} />
        <StatCard label="Disetujui" value={activities.filter(a => a.status === 'approved').length} />
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/track')}
        style={{
          width: '100%', padding: '16px', borderRadius: 14,
          background: permissionStatus === 'denied'
            ? '#94a3b8'
            : 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: '#fff', border: 'none', fontSize: 16, fontWeight: 700,
          cursor: permissionStatus === 'denied' ? 'not-allowed' : 'pointer',
          marginBottom: 24
        }}
        disabled={permissionStatus === 'denied'}
      >
        🏃 Mulai Lari Baru
      </button>

      {/* Activity list */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Riwayat Aktivitas</h2>
      {loading ? <p style={{ color: '#999' }}>Memuat...</p> : (
        activities.length === 0
          ? <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Belum ada aktivitas</p>
          : activities.map(act => <ActivityCard key={act.id} activity={act} />)
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#f5f5f0', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 700 }}>{value}</p>
      <p style={{ fontSize: 11, color: '#888' }}>{label}</p>
    </div>
  )
}

function ActivityCard({ activity: a }) {
  const s = STATUS_STYLE[a.status]
  const date = new Date(a.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '1rem',
      marginBottom: 10, border: '1px solid #eee'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 2 }}>
            {(a.distance_meters / 1000).toFixed(2)} km
          </p>
          <p style={{ fontSize: 12, color: '#888' }}>{date}</p>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 20,
          background: s.bg, color: s.color, fontWeight: 600
        }}>
          {s.label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#666' }}>
        <span>⏱ {formatDuration(a.duration_seconds)}</span>
        <span>💨 {a.avg_speed_kmh.toFixed(1)} km/j</span>
      </div>
      {a.teacher_note && (
        <p style={{ fontSize: 12, marginTop: 8, color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          💬 Catatan guru: {a.teacher_note}
        </p>
      )}
    </div>
  )
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}m ${s}s`
}