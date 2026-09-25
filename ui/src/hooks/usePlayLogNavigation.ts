import { useEffect, useState } from 'react'

import type { PlayLogRow } from '../types/playLog'

type NavigationState = {
  selectedId: string | null
  showSettings: boolean
  row: PlayLogRow | null
}

type HistoryState = {
  type?: 'list' | 'detail' | 'settings'
  row?: PlayLogRow
}

function getNavigationState(): NavigationState {
  const params = new URLSearchParams(window.location.search)
  const historyState =
    window.history.state as HistoryState | null

  return {
    selectedId: params.get('play'),
    showSettings: params.get('settings') === '1',
    row:
      historyState?.type === 'detail'
        ? historyState.row ?? null
        : null,
  }
}

export function usePlayLogNavigation() {
  const [navigationState, setNavigationState] =
    useState<NavigationState>(getNavigationState)

  useEffect(() => {
    const handlePopState = () => {
      setNavigationState(getNavigationState())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const openDetail = (row: PlayLogRow) => {
    window.history.pushState(
      {
        type: 'detail',
        row,
      },
      '',
      `?play=${encodeURIComponent(row.play_id)}`,
    )

    setNavigationState({
      selectedId: row.play_id,
      showSettings: false,
      row,
    })
  }

  const openHistory = () => {
    window.history.pushState(
      {
        type: 'list',
      },
      '',
      window.location.pathname,
    )

    setNavigationState({
      selectedId: null,
      showSettings: false,
      row: null,
    })
  }

  const openSettings = () => {
    window.history.pushState(
      {
        type: 'settings',
      },
      '',
      '?settings=1',
    )

    setNavigationState({
      selectedId: null,
      showSettings: true,
      row: null,
    })
  }

  const goBack = () => {
    window.history.back()
  }

  return {
    selectedId: navigationState.selectedId,
    showSettings: navigationState.showSettings,
    navigationRow: navigationState.row,
    openDetail,
    openHistory,
    openSettings,
    goBack,
  }
}
