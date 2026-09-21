import path from 'node:path'

export function getDataRoot() {
  const localAppData = process.env.LOCALAPPDATA

  if (!localAppData) {
    throw new Error('LOCALAPPDATA is not defined')
  }

  return path.join(
    localAppData,
    'SDVX PlayLog Tool',
    'data',
  )
}
