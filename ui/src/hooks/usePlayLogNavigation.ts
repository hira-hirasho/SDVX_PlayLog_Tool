import { useEffect, useState } from 'react'

export function usePlayLogNavigation() {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('play')
  })

  useEffect(() => {
    const handlePopState = () => {
      setSelectedId(new URLSearchParams(window.location.search).get('play'))
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const openDetail = (playId: string) => {
    window.history.pushState({}, '', `?play=${encodeURIComponent(playId)}`)
    setSelectedId(playId)
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      setSelectedId(null)
    }
  }

  return {
    selectedId,
    openDetail,
    goBack,
  }
}
