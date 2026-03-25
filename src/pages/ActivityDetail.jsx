import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

  if (loading) return <div style={{ padding: '2rem' }}>Memuat...</div>
  if (!activity) return <div style={{ padding: '2rem' }}>Aktivitas tidak ditemukan</div>

  const a = activity
  const date = new Date(a.started_at).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '1.5rem', minHeight: '100vh' }}>
      <button onClick={() => navigate('/teacher')} style={{ marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 14 }}>
        ← Kembali
      </button>

      <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid #eee', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{a.profiles?.full_name}</h2>
            <p style={{ fontSize: 12, color: '#888' }}>{a.profiles?.class_name} · {date}</p>
          </div>
          <StatusBadge status={a.status} />
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Metric label="Jarak" value={`${(a.distance_meters / 1000).toFixed(2)} km`} />
          <Metric label="Durasi" value={formatDuration(a.duration_seconds)} />
          <Metric label="Kecepatan rata-rata" value={`${a.avg_speed_kmh.toFixed(1)} km/j`} />
          <Metric label="Waktu mulai" value={new Date(a.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} />
        </div>
      </div>

      {/* Validasi sederhana */}
      {a.avg_speed_kmh > 20 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '0.75rem', marginBottom: 16, fontSize: 13 }}>
          ⚠️ <strong>Perhatian:</strong> Kecepatan rata-rata {a.avg_speed_kmh.toFixed(1)} km/j terlihat tinggi untuk lari. Harap verifikasi.
        </div>
      )}
      {a.distance_meters < 100 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '0.75rem', marginBottom: 16, fontSize: 13 }}>
          ⚠️ <strong>Perhatian:</strong> Jarak terlalu pendek ({(a.distance_meters).toFixed(0)}m). Mungkin tidak valid.
        </div>
      )}

      {/* Review area */}
      {a.status === 'submitted' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Review Aktivitas</h3>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Catatan untuk siswa (opsional)..."
            rows={3}
            style={{
              width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd',
              fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => updateStatus('approved')}
              disabled={saving}
              style={{ flex: 1, padding: 12, borderRadius: 10, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              ✅ Setujui
            </button>
            <button
              onClick={() => updateStatus('rejected')}
              disabled={saving}
              style={{ flex: 1, padding: 12, borderRadius: 10, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              ❌ Tolak
            </button>
          </div>
        </div>
      )}

      {a.status !== 'submitted' && a.teacher_note && (
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '1rem', border: '1px solid #bbf7d0' }}>
          <p style={{ fontSize: 13, color: '#166534' }}>💬 Catatan guru: {a.teacher_note}</p>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div style={{ background: '#f9f9f7', borderRadius: 10, padding: '0.75rem' }}>
      <p style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 600 }}>{value}</p>
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
  return <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
}
function formatDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}m ${String(s).padStart(2,'0')}s`
}