export default function LocationPermissionModal({ onAllow, onSkip, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet" style={{ maxWidth: 420 }}>
        <div className="modal-body">
          <div className="permission-icon">📍</div>

          <h2 className="text-h1" style={{ textAlign: 'center', marginBottom: 8 }}>
            Izin Akses Lokasi
          </h2>

          <p className="text-secondary" style={{ textAlign: 'center', marginBottom: 20, fontSize: 14 }}>
            RunTracker membutuhkan akses lokasi GPS untuk mencatat jarak dan rute lari kamu secara akurat.
          </p>

          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <span>💡</span>
            <span>
              Saat browser meminta izin, pilih <strong>"Allow While Using App"</strong> atau{' '}
              <strong>"Izinkan"</strong> agar GPS bekerja saat lari.
            </span>
          </div>

          <button
            onClick={onAllow}
            disabled={loading}
            className="btn btn-primary btn-lg btn-block"
            style={{ marginBottom: 10 }}
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Meminta izin...' : 'Izinkan Akses Lokasi'}
          </button>

          <button onClick={onSkip} disabled={loading} className="btn btn-ghost btn-block">
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}
