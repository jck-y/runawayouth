import { useState, useEffect } from 'react'

export function useLocationPermission() {
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  // 'unknown' | 'granted' | 'denied' | 'requesting'

  useEffect(() => {
    // Cek status izin yang sudah ada (tanpa meminta)
    if (!navigator.permissions) {
      setPermissionStatus('unknown')
      return
    }
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      setPermissionStatus(result.state) // 'granted' | 'denied' | 'prompt'
      result.onchange = () => setPermissionStatus(result.state)
    })
  }, [])

  function requestPermission() {
    return new Promise((resolve) => {
      setPermissionStatus('requesting')
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionStatus('granted')
          resolve('granted')
        },
        (err) => {
          if (err.code === 1) {
            setPermissionStatus('denied')
            resolve('denied')
          } else {
            setPermissionStatus('granted') // timeout/unavailable bukan berarti denied
            resolve('granted')
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  return { permissionStatus, requestPermission }
}