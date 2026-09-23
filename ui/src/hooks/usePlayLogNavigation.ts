import { useEffect, useState } from 'react'

function getNavigationState() {
  const params = new URLSearchParams(window.location.search)

  return {
    selectedId: params.get('play'),
    showSettings: params.get('settings') === '1',
  }
}

export function usePlayLogNavigation() {
  const [navigationState, setNavigationState] = useState(
    getNavigationState,
  )

  useEffect(() => {
    const handlePopState = () => {
      setNavigationState(getNavigationState())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const openDetail = (playId: string) => {
    window.history.pushState(
      {},
      '',
      `?play=${encodeURIComponent(playId)}`,
    )

    setNavigationState({
      selectedId: playId,
      showSettings: false,
    })
  }

  const openSettings = () => {
    window.history.pushState({}, '', '?settings=1')

    setNavigationState({
      selectedId: null,
      showSettings: true,
    })
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      setNavigationState({
        selectedId: null,
        showSettings: false,
      })
    }
  }

  return {
    selectedId: navigationState.selectedId,
    showSettings: navigationState.showSettings,
    openDetail,
    openSettings,
    goBack,
  }
}
