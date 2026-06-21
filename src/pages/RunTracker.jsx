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
    <div className="tracker-screen">
      <div className="tracker-topbar">
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">← Kembali</button>
        <span className="text-h2">Tracking Lari</span>
        <span style={{ width: 70 }} />
      </div>

      <div className="tracker-body">
        {tracker.status === 'tracking' && (
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-small">GPS aktif · {tracker.points.length} titik terekam</span>
          </div>
        )}

        {tracker.error && (
          <div className="alert alert-warning">⚠️ <span>{tracker.error}</span></div>
        )}

        <div className="tracker-metric-grid">
          <div className="tracker-metric-card primary">
            <span className="text-caption">Jarak</span>
            <span className="metric-value">{tracker.distanceKm}<span className="metric-unit">km</span></span>
          </div>
          <div className="tracker-metric-card primary">
            <span className="text-caption">Waktu</span>
            <span className="metric-value" style={{ fontSize: 24 }}>{tracker.durationFormatted}</span>
          </div>
          <div className="tracker-metric-card">
            <span className="text-caption">Kecepatan Rata-rata</span>
            <span className="metric-value" style={{ fontSize: 22 }}>{tracker.avgSpeedKmh}<span className="metric-unit">km/j</span></span>
          </div>
          <div className="tracker-metric-card">
            <span className="text-caption">Titik GPS</span>
            <span className="metric-value" style={{ fontSize: 22 }}>{tracker.points.length}<span className="metric-unit">pts</span></span>
          </div>
        </div>

        {tracker.status === 'idle' && (
          <p className="text-small" style={{ textAlign: 'center' }}>
            Saat diminta izin lokasi, pilih <strong>"Allow While Using App"</strong>
          </p>
        )}

        {tracker.status === 'idle' && (
          <button onClick={tracker.startTracking} className="btn btn-primary btn-lg btn-block">
            ▶ Mulai Lari
          </button>
        )}

        {tracker.status === 'tracking' && (
          <button onClick={tracker.stopTracking} className="btn btn-danger btn-lg btn-block">
            ⏹ Berhenti
          </button>
        )}

        {tracker.status === 'finished' && (
          <>
            <div className="card card-pad">
              <p className="text-caption mb-3">Ringkasan Aktivitas</p>
              <div className="flex-col gap-2 text-body">
                <p>📏 {tracker.distanceKm} km</p>
                <p>⏱ {tracker.durationFormatted}</p>
                <p>💨 {tracker.avgSpeedKmh} km/j rata-rata</p>
              </div>
            </div>

            {submitError && <div className="alert alert-danger">⚠️ <span>{submitError}</span></div>}

            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary btn-lg btn-block">
              {submitting ? <span className="spinner" /> : '✅'} {submitting ? 'Menyimpan...' : 'Submit ke Guru'}
            </button>

            <button onClick={() => window.location.reload()} className="btn btn-secondary btn-block">
              Mulai ulang
            </button>
          </>
        )}
      </div>
    </div>
  )
}
