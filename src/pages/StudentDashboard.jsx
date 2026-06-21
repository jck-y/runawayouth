import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useLocationPermission } from '../hooks/useLocationPermission'
import LocationPermissionModal from '../components/LocationPermissionModal'
import AppShell from '../components/layout/AppShell'
import KpiCard from '../components/ui/KpiCard'
import StatusBadge from '../components/ui/StatusBadge'
import { EmptyState, LoadingState } from '../components/ui/States'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const { permissionStatus, requestPermission } = useLocationPermission()

  // Tampilkan modal jika izin belum diberikan dan belum pernah ditolak
  useEffect(() => {
    if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
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

  const approved = activities.filter(a => a.status === 'approved')
  const totalKm = approved.reduce((sum, a) => sum + a.distance_meters / 1000, 0)
  const avgPace = approved.length
    ? approved.reduce((sum, a) => sum + a.avg_speed_kmh, 0) / approved.length
    : 0

  return (
    <AppShell
      role="student"
      active="dashboard"
      title={`Halo, ${profile?.full_name || ''}`}
      subtitle={`Siswa · ${profile?.class_name || 'Kelas belum diset'}`}
      actions={
        <button
          onClick={() => navigate('/track')}
          disabled={permissionStatus === 'denied'}
          className="btn btn-primary"
        >
          🏃 Mulai Lari Baru
        </button>
      }
    >
      {showLocationModal && (
        <LocationPermissionModal
          onAllow={handleAllowLocation}
          onSkip={() => setShowLocationModal(false)}
          loading={requesting}
        />
      )}

      {permissionStatus === 'denied' && (
        <div className="alert alert-warning mb-6">
          ⚠️ <span>Izin GPS ditolak. Buka <strong>Pengaturan Browser → Izin Situs</strong> untuk mengaktifkan lokasi.</span>
        </div>
      )}

      {permissionStatus === 'granted' && (
        <div className="alert alert-success mb-6">
          <span className="live-dot" /> <span>GPS siap digunakan</span>
        </div>
      )}

      <div className="kpi-grid mb-6">
        <KpiCard icon="📏" label="Total Jarak Disetujui" value={totalKm.toFixed(1)} unit="km" />
        <KpiCard icon="🗂️" label="Total Aktivitas" value={activities.length} />
        <KpiCard icon="✅" label="Disetujui" value={approved.length} />
        <KpiCard icon="⚡" label="Kecepatan Rata-rata" value={avgPace.toFixed(1)} unit="km/j" />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-h2">Riwayat Aktivitas</h2>
        </div>
        <div className="card-pad" style={{ paddingTop: 'var(--space-4)' }}>
          {loading ? (
            <LoadingState label="Memuat riwayat aktivitas..." />
          ) : activities.length === 0 ? (
            <EmptyState
              icon="🏃"
              title="Belum ada aktivitas"
              description="Mulai sesi lari pertamamu dan hasilnya akan muncul di sini setelah disubmit."
            />
          ) : (
            activities.map(act => <ActivityRow key={act.id} activity={act} />)
          )}
        </div>
      </div>
    </AppShell>
  )
}

function ActivityRow({ activity: a }) {
  const date = new Date(a.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  return (
    <div className="row-card">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-h3" style={{ marginBottom: 2 }}>{(a.distance_meters / 1000).toFixed(2)} km</p>
          <p className="text-small">{date}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="flex gap-4 mt-3 text-small">
        <span>⏱ {formatDuration(a.duration_seconds)}</span>
        <span>💨 {a.avg_speed_kmh.toFixed(1)} km/j</span>
      </div>
      {a.teacher_note && (
        <p className="text-small mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
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
