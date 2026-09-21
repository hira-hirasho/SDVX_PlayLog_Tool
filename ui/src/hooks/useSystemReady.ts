import { useEffect, useState } from 'react'

export function useSystemReady() {
  const [systemReady, setSystemReady] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setSystemReady(true), 550)
    return () => clearTimeout(id)
  }, [])

  return systemReady
}
