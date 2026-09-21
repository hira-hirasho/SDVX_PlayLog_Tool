import { useState } from 'react'

export function usePlayLogFilters() {
  const [songName, setSongName] = useState('')
  const [artist, setArtist] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const resetFilters = () => {
    setSongName('')
    setArtist('')
    setStartDate('')
    setEndDate('')
  }

  return {
    songName,
    setSongName,
    artist,
    setArtist,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    resetFilters,
  }
}
