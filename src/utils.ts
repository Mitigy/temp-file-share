import type { ExpiryDuration, ExpiryType, UploadCardData } from './types'

export const isValidFile = (file: any): file is File =>
  file instanceof File && file.size > 0 && file.name.trim() !== ''

export const DURATION_MILLISECONDS: Record<ExpiryDuration, number> = {
  '10min': 10 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
  '7days': 7 * 24 * 60 * 60 * 1000,
}

export const isValidExpiryType = (value: any): value is ExpiryType =>
  typeof value === 'string' && ['10min', '1hour', '1day', '7days', 'custom'].includes(value)

export function getExpirationTimestamp(expiryDuration: ExpiryDuration): number
export function getExpirationTimestamp(expiryType: 'custom', customDate: Date): number
export function getExpirationTimestamp(expiryType: ExpiryType, customDate?: Date): number {
  if (expiryType === 'custom') {
    if (!customDate) throw new Error('Custom date required for custom expiry')
    return customDate.getTime()
  }
  const now = Date.now()
  return now + DURATION_MILLISECONDS[expiryType]
}

export const createShareLink = (uploadCardData: UploadCardData): string => {
  const hash = btoa(JSON.stringify(uploadCardData))

  const shareURL = new URL(location.href)
  shareURL.hash = hash
  return shareURL.toString()
}

const isUploadCardData = (data: any): data is UploadCardData => {
  return (
    data !== null &&
    typeof data === 'object' &&
    typeof data.fileName === 'string' &&
    typeof data.directDownloadLink === 'string' &&
    typeof data.guestToken === 'string' &&
    typeof data.expirationTimestampMS === 'number'
  )
}

export const parseAndValidateShareHash = (hash: string): UploadCardData => {
  if (hash.trim().length === 0) {
    throw new Error('No hash provided')
  }

  let data: unknown
  try {
    const decoded = atob(hash)
    data = JSON.parse(decoded)
  } catch (error) {
    console.error('Error decoding or parsing share hash:', error)
    throw new Error('Invalid share hash format')
  }

  if (!isUploadCardData(data)) {
    throw new Error('Invalid upload card data')
  }

  return data
}
