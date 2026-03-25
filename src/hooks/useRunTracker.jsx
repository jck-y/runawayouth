import { useState, useRef, useCallback } from "react";

// Hitung jarak antara dua titik GPS (Haversine formula)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Validasi titik GPS
function isValidPoint(prev, curr) {
  if (!prev) return true;

  const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // detik

  // Skip jika akurasi buruk (> 50 meter)
  if (curr.accuracy > 50) return false;

  // Skip jika titik terlalu dekat (< 5 meter) — noise GPS
  if (dist < 5) return false;

  // Skip jika kecepatan tidak masuk akal (> 15 m/s = 54 km/jam untuk lari)
  if (timeDiff > 0 && dist / timeDiff > 15) return false;

  return true;
}

export function useRunTracker() {
  const [status, setStatus] = useState("idle"); // idle | tracking | paused | finished
  const [points, setPoints] = useState([]);
  const [distanceM, setDistanceM] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastPointRef = useRef(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS tidak tersedia di perangkat ini");
      return;
    }

    setStatus("tracking");
    setPoints([]);
    setDistanceM(0);
    setDurationSec(0);
    setError(null);
    startTimeRef.current = Date.now();
    lastPointRef.current = null;

    // Timer tiap detik
    timerRef.current = setInterval(() => {
      setDurationSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Watch GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed_ms: pos.coords.speed,
          timestamp: pos.timestamp,
        };

        if (!isValidPoint(lastPointRef.current, newPoint)) return;

        if (lastPointRef.current) {
          const d = haversineDistance(
            lastPointRef.current.lat,
            lastPointRef.current.lng,
            newPoint.lat,
            newPoint.lng,
          );
          setDistanceM((prev) => prev + d);
        }

        lastPointRef.current = newPoint;
        setPoints((prev) => [...prev, newPoint]);
      },
      (err) => {
        setError("GPS error: " + err.message);
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus("finished");
  }, []);

  // Hitung kecepatan rata-rata dalam km/jam
  const avgSpeedKmh = durationSec > 0 ? (distanceM / durationSec) * 3.6 : 0;

  // Format durasi HH:MM:SS
  const formatDuration = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  return {
    status,
    points,
    error,
    distanceM,
    distanceKm: (distanceM / 1000).toFixed(2),
    durationSec,
    durationFormatted: formatDuration(durationSec),
    avgSpeedKmh: avgSpeedKmh.toFixed(1),
    startTracking,
    stopTracking,
  };
}
