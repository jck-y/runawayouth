import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const STATUS_FILTER = ['all', 'submitted', 'approved', 'rejected']

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadActivities()
    // Realtime subscription
    const sub = supabase
      .channel('activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, loadActivities)
      .subscribe()
    return () => sub.unsubscribe()
  }, [])

  async function loadActivities() {
    const { data } = await supabase
      .from('activities')
      .select(`
        *,
        profiles (full_name, class_name)
      `)
      .order('created_at', { ascending: false })
    setActivities(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all'
    ? activities
    : activities.filter(a => a.status === filter)

  const counts = {
    all: activities.length,
    submitted: activities.filter(a => a.status === 'submitted').length,
    approved: activities.filter(a => a.status === 'approved').length,
    rejected: activities.filter(a => a.status === 'rejected').length,
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard Guru</h1>
          <p style={{ fontSize: 13, color: '#666' }}>{profile?.full_name}</p>
        </div>
        <button onClick={signOut} style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>
          Keluar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {STATUS_FILTER.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '10px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: filter === s ? '#2563eb' : '#f5f5f0',
              color: filter === s ? '#fff' : '#333',
              fontWeight: 600, fontSize: 12
            }}
          >
            <div style={{ fontSize: 18 }}>{counts[s]}</div>
            <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'capitalize' }}>
              {s === 'all' ? 'Semua' : s === 'submitted' ? 'Pending' : s === 'approved' ? 'Acc' : 'Tolak'}
            </div>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <p style={{ color: '#999' }}>Memuat...</p> : (
        filtered.length === 0
          ? <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Tidak ada data</p>
          : filtered.map(act => (
            <div
              key={act.id}
              onClick={() => navigate(`/activity/${act.id}`)}
              style={{
                background: '#fff', borderRadius: 12, padding: '1rem',
                marginBottom: 10, border: '1px solid #eee', cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{act.profiles?.full_name}</p>
                  <p style={{ fontSize: 12, color: '#888' }}>{act.profiles?.class_name}</p>
                </div>
                <StatusBadge status={act.status} />
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
                <span>📏 {(act.distance_meters / 1000).toFixed(2)} km</span>
                <span>⏱ {Math.floor(act.duration_seconds / 60)}m</span>
                <span>💨 {act.avg_speed_kmh.toFixed(1)} km/j</span>
              </div>
            </div>
          ))
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    submitted: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    approved:  { bg: '#d1fae5', color: '#065f46', label: 'Disetujui' },
    rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Ditolak' },
  }
  const s = map[status]
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}