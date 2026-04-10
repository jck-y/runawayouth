function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isValidPoint(prev, curr) {
  if (!prev) return true

  const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng)
  const timeDiffSec = (curr.timestamp - prev.timestamp) / 1000

  // Tolak jika akurasi buruk
  // iOS perlu threshold lebih longgar — pakai 80m bukan 50m
  if (curr.accuracy > 80) return false

  // Tolak jika waktu antar titik terlalu pendek (< 1 detik)
  // mencegah duplikat event dari iOS
  if (timeDiffSec < 1) return false

  // Tolak jika titik tidak bergerak sama sekali (noise GPS diam)
  if (dist < 3) return false

  // Hitung kecepatan dari koordinat, BUKAN dari coords.speed
  // karena coords.speed di iOS sering null/negatif/tidak akurat
  if (timeDiffSec > 0) {
    const speedMs = dist / timeDiffSec

    // Lebih dari 12 m/s (43 km/j) tidak wajar untuk lari
    if (speedMs > 12) return false

    // Tolak jika GPS loncat terlalu jauh dalam waktu singkat
    // (GPS glitch — koordinat tiba-tiba jauh lalu kembali)
    if (dist > 50 && timeDiffSec < 5) return false
  }

  return true
}

export function useRunTracker() {
  const [status, setStatus] = useState('idle')
  const [points, setPoints] = useState([])
  const [distanceM, setDistanceM] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [error, setError] = useState(null)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const lastPointRef = useRef(null)
  const totalDistRef = useRef(0) // ← pakai ref, bukan hanya state

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS tidak tersedia di perangkat ini')
      return
    }

    setStatus('tracking')
    setPoints([])
    setDistanceM(0)
    setError(null)
    setDurationSec(0)
    startTimeRef.current = Date.now()
    lastPointRef.current = null
    totalDistRef.current = 0

    timerRef.current = setInterval(() => {
      setDurationSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          // Hitung speed dari koordinat, simpan untuk referensi saja
          speed_ms: null,
          timestamp: pos.timestamp,
        }

        if (!isValidPoint(lastPointRef.current, newPoint)) return

        if (lastPointRef.current) {
          const d = haversineDistance(
            lastPointRef.current.lat, lastPointRef.current.lng,
            newPoint.lat, newPoint.lng
          )
          totalDistRef.current += d
          setDistanceM(totalDistRef.current)
        }

        lastPointRef.current = newPoint
        setPoints(prev => [...prev, newPoint])
      },
      (err) => {
        // iOS kadang throw error permission saat background
        // jangan langsung stop, coba toleransi dulu
        if (err.code === 1) {
          // PERMISSION_DENIED — ini baru stop
          setError('Izin GPS ditolak. Aktifkan lokasi di Settings.')
          stopTracking()
        } else {
          // POSITION_UNAVAILABLE atau TIMEOUT — cukup warning
          setError('GPS sinyal lemah, mencoba lagi...')
          setTimeout(() => setError(null), 3000)
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,  // ← iOS: boleh pakai cache maks 2 detik
        timeout: 15000,    // ← lebih toleran dari 10000
      }
    )
  }, [])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setStatus('finished')
  }, [])

  const avgSpeedKmh = durationSec > 0
    ? (totalDistRef.current / durationSec) * 3.6
    : 0

  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
  }

  return {
    status, points, error,
    distanceM,
    distanceKm: (totalDistRef.current / 1000).toFixed(2),
    durationSec,
    durationFormatted: formatDuration(durationSec),
    avgSpeedKmh: avgSpeedKmh.toFixed(1),
    startTracking,
    stopTracking,
  }
}