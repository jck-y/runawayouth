export default function LocationPermissionModal({ onAllow, onSkip, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '1.5rem',
        width: '100%', maxWidth: 420,
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem', fontSize: 28
        }}>
          📍
        </div>

        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Izin Akses Lokasi
        </h2>

        <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          RunTracker membutuhkan akses lokasi GPS untuk mencatat jarak dan rute lari kamu secara akurat.
        </p>

        {/* Panduan iOS */}
        <div style={{
          background: '#f0f9ff', borderRadius: 12, padding: '0.75rem 1rem',
          marginBottom: 20, border: '1px solid #bae6fd'
        }}>
          <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>
            💡 Saat browser meminta izin:
          </p>
          <p style={{ fontSize: 12, color: '#0369a1' }}>
            Pilih <strong>"Allow While Using App"</strong> atau <strong>"Izinkan"</strong> agar GPS bekerja saat lari.
          </p>
        </div>

        <button
          onClick={onAllow}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#fff', border: 'none', fontWeight: 700,
            fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 10
          }}
        >
          {loading ? '⏳ Meminta izin...' : '📍 Izinkan Akses Lokasi'}
        </button>

        <button
          onClick={onSkip}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            background: 'none', color: '#999', border: '1px solid #eee',
            fontSize: 14, cursor: 'pointer'
          }}
        >
          Nanti saja
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}