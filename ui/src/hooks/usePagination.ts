import { useState } from 'react'

export function usePagination() {
  const [page, setPage] = useState(0)

  return {
    page,
    setPage,
  }
}
