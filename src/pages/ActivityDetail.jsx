import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppShell from '../components/layout/AppShell'
import StatusBadge from '../components/ui/StatusBadge'
import { LoadingState, EmptyState } from '../components/ui/States'

export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activity, setActivity] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('activities')
        .select('*, profiles(full_name, class_name)')
        .eq('id', id)
        .single()
      setActivity(data)
      setNote(data?.teacher_note || '')
      setLoading(false)
    }
    load()
  }, [id])

  const updateStatus = async (status) => {
    setSaving(true)
    await supabase
      .from('activities')
      .update({ status, teacher_note: note })
      .eq('id', id)
    setSaving(false)
    navigate('/teacher')
  }

  const body = () => {
    if (loading) return <LoadingState label="Memuat detail aktivitas..." />
    if (!activity) return <EmptyState icon="❓" title="Aktivitas tidak ditemukan" />

    const a = activity
    const date = new Date(a.started_at).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    return (
      <div style={{ maxWidth: 560 }}>
        <div className="card card-pad mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-h1" style={{ fontSize: 18 }}>{a.profiles?.full_name}</h2>
              <p className="text-small">{a.profiles?.class_name} · {date}</p>
            </div>
            <StatusBadge status={a.status} />
          </div>

          <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Metric label="Jarak" value={`${(a.distance_meters / 1000).toFixed(2)} km`} />
            <Metric label="Durasi" value={formatDuration(a.duration_seconds)} />
            <Metric label="Kecepatan Rata-rata" value={`${a.avg_speed_kmh.toFixed(1)} km/j`} />
            <Metric label="Waktu Mulai" value={new Date(a.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} />
          </div>
        </div>

        {a.photo_url && (
          <div className="card card-pad mb-4">
            <p className="text-caption mb-3">Foto Bukti Lari</p>
            <img
              src={a.photo_url}
              alt="Bukti lari"
              style={{
                width: '100%',
                maxHeight: 360,
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
        )}

        {!a.photo_url && (
          <div className="alert alert-warning mb-4">
            ⚠️ <span>Aktivitas ini tidak memiliki foto bukti.</span>
          </div>
        )}

        {a.avg_speed_kmh > 20 && (
          <div className="alert alert-warning mb-4">
            ⚠️ <span><strong>Perhatian:</strong> Kecepatan rata-rata {a.avg_speed_kmh.toFixed(1)} km/j terlihat tinggi untuk lari. Harap verifikasi.</span>
          </div>
        )}
        {a.distance_meters < 100 && (
          <div className="alert alert-warning mb-4">
            ⚠️ <span><strong>Perhatian:</strong> Jarak terlalu pendek ({a.distance_meters.toFixed(0)}m). Mungkin tidak valid.</span>
          </div>
        )}

        {a.status === 'submitted' && (
          <div className="card card-pad">
            <h3 className="text-h2 mb-3">Review Aktivitas</h3>
            <textarea
              className="textarea mb-3"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Notes for Student(opsional)..."
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => updateStatus('approved')} disabled={saving} className="btn btn-success btn-block">
                {saving ? <span className="spinner" /> : '✅'} Setujui
              </button>
              <button onClick={() => updateStatus('rejected')} disabled={saving} className="btn btn-danger btn-block">
                {saving ? <span className="spinner" /> : '❌'} Tolak
              </button>
            </div>
          </div>
        )}

        {a.status !== 'submitted' && a.teacher_note && (
          <div className="alert alert-success">
            💬 <span>notes: {a.teacher_note}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell
      role="teacher"
      active="overview"
      title="Detail Aktivitas"
      subtitle="Tinjau dan validasi aktivitas siswa"
      actions={
        <button onClick={() => navigate('/teacher')} className="btn btn-secondary btn-sm">← Kembali</button>
      }
    >
      {body()}
    </AppShell>
  )
}

function Metric({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
      <p className="text-caption" style={{ marginBottom: 4 }}>{label}</p>
      <p className="text-h3" style={{ fontSize: 15 }}>{value}</p>
    </div>
  )
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}