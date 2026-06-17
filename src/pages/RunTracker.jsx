import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRunTracker } from '../hooks/useRunTracker'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function RunTracker() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const tracker = useRunTracker()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async () => {
    if (tracker.distanceM < 100) {
      setSubmitError('Jarak minimal 100 meter')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      // 1. Simpan aktivitas
      const startedAt = new Date(
        tracker.points[0]?.timestamp || Date.now() - tracker.durationSec * 1000
      )
      const endedAt = new Date()

      const { data: activity, error: actErr } = await supabase
        .from('activities')
        .insert({
          student_id: profile.id,
          distance_meters: tracker.distanceM,
          duration_seconds: tracker.durationSec,
          avg_speed_kmh: parseFloat(tracker.avgSpeedKmh),
          status: 'submitted',
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
        })
        .select()
        .single()

      if (actErr) throw actErr

      // 2. Simpan GPS points (batch insert)
      if (tracker.points.length > 0) {
        const pointsData = tracker.points.map(p => ({
          activity_id: activity.id,
          lat: p.lat,
          lng: p.lng,
          accuracy: p.accuracy,
          speed_ms: p.speed_ms,
          recorded_at: new Date(p.timestamp).toISOString(),
        }))

        const { error: ptErr } = await supabase
          .from('activity_points')
          .insert(pointsData)

        if (ptErr) console.warn('Points save error:', ptErr)
      }

      navigate('/dashboard')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} style={ghostBtn}>← Kembali</button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Tracking Lari</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Jarak" value={tracker.distanceKm} unit="km" big />
        <MetricCard label="Waktu" value={tracker.durationFormatted} unit="" big />
        <MetricCard label="Kecepatan rata-rata" value={tracker.avgSpeedKmh} unit="km/j" />
        <MetricCard label="Titik GPS" value={tracker.points.length} unit="pts" />
      </div>

      {/* GPS status */}
      {tracker.error && (
        <div style={{ background: '#ff333322', border: '1px solid #ff3333', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {tracker.error}
        </div>
      )}

      {/* Status indicator */}
      {tracker.status === 'tracking' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: '#22c55e',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ fontSize: 13, color: '#aaa' }}>GPS aktif · {tracker.points.length} titik terekam</span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tracker.status === 'idle' && (
          <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 12 }}>
            Saat diminta izin lokasi, pilih <strong>"Allow While Using App"</strong>
          </p>
        )}

        {tracker.status === 'tracking' && (
          <button onClick={tracker.stopTracking} style={primaryBtn('#ef4444')}>
            ⏹ Berhenti
          </button>
        )}

        {tracker.status === 'finished' && (
          <>
            <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '1rem', marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>Ringkasan aktivitas</p>
              <p>📏 {tracker.distanceKm} km</p>
              <p>⏱ {tracker.durationFormatted}</p>
              <p>💨 {tracker.avgSpeedKmh} km/j rata-rata</p>
            </div>

            {submitError && (
              <p style={{ color: '#ff6666', fontSize: 13 }}>{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={primaryBtn('#2563eb')}
            >
              {submitting ? 'Menyimpan...' : '✅ Submit ke Guru'}
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{ ...primaryBtn('#333'), color: '#aaa' }}
            >
              Mulai ulang
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

function MetricCard({ label, value, unit, big }) {
  return (
    <div style={{
      background: '#1a1a1a', borderRadius: 12, padding: '1rem',
      display: 'flex', flexDirection: 'column', gap: 4
    }}>
      <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
      <p style={{ fontSize: big ? 32 : 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value} <span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>{unit}</span>
      </p>
    </div>
  )
}

const ghostBtn = { background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13 }
const primaryBtn = (bg) => ({
  padding: '14px', borderRadius: 12, background: bg, color: '#fff',
  border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', width: '100%'
})