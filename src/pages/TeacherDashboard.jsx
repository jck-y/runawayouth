import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import AppShell from '../components/layout/AppShell'
import KpiCard from '../components/ui/KpiCard'
import StatusBadge from '../components/ui/StatusBadge'
import { EmptyState, LoadingState } from '../components/ui/States'

const STATUS_FILTER = ['all', 'submitted', 'approved', 'rejected']
const FILTER_LABEL = { all: 'Semua', submitted: 'Pending', approved: 'Disetujui', rejected: 'Ditolak' }

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
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

  const totalKmApproved = activities
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.distance_meters / 1000, 0)

  return (
    <AppShell
      role="teacher"
      active="overview"
      title="Ringkasan Aktivitas"
      subtitle={profile?.full_name}
    >
      <div className="kpi-grid mb-6">
        <KpiCard icon="🗂️" label="Total Aktivitas" value={counts.all} />
        <KpiCard icon="⏳" label="Menunggu Review" value={counts.submitted} />
        <KpiCard icon="✅" label="Disetujui" value={counts.approved} />
        <KpiCard icon="📏" label="Total Km Disetujui" value={totalKmApproved.toFixed(1)} unit="km" />
      </div>

      <div className="filter-tabs mb-6">
        {STATUS_FILTER.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`filter-tab ${filter === s ? 'active' : ''}`}
          >
            <div className="count">{counts[s]}</div>
            <div className="label">{FILTER_LABEL[s]}</div>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-h2">Daftar Aktivitas</h2>
          <span className="text-small">{filtered.length} entri</span>
        </div>

        {loading ? (
          <LoadingState label="Memuat data aktivitas..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Tidak ada data"
            description="Belum ada aktivitas pada kategori filter ini."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Kelas</th>
                  <th>Jarak</th>
                  <th>Durasi</th>
                  <th>Kecepatan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(act => (
                  <tr key={act.id} onClick={() => navigate(`/activity/${act.id}`)}>
                    <td className="cell-name">{act.profiles?.full_name}</td>
                    <td className="cell-secondary">{act.profiles?.class_name || '—'}</td>
                    <td>{(act.distance_meters / 1000).toFixed(2)} km</td>
                    <td className="cell-secondary">{Math.floor(act.duration_seconds / 60)}m</td>
                    <td className="cell-secondary">{act.avg_speed_kmh.toFixed(1)} km/j</td>
                    <td><StatusBadge status={act.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
