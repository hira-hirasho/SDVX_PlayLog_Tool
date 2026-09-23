import path from 'node:path'

export function getAppDataRoot() {
  const localAppData = process.env.LOCALAPPDATA

  if (!localAppData) {
    throw new Error('LOCALAPPDATA is not defined')
  }

  return path.join(
    localAppData,
    'SDVX PlayLog Tool',
  )
}

export function getConfigPath() {
  return path.join(
    getAppDataRoot(),
    'config.yaml',
  )
}

export function getDataRoot() {
  return path.join(
    getAppDataRoot(),
    'data',
  )
}
