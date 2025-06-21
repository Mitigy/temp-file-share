import type { GoFileAccountToken, GoFileContentsInfo, GoFileContentsResponse, GoFileDeleteUploadResponse, GoFileExpiryInfo, GoFileFolderID, GoFileGuestAccountInfo, GoFileGuestAccountResponse, GoFileUpdateExpiryResponse, GoFileUpload, GoFileUploadResponse } from './types'

export class GoFileClient {
  async uploadFile(file: File): Promise<GoFileUpload> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('https://upload.gofile.io/uploadfile', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const uploadResponse = await response.json() as GoFileUploadResponse
    if (uploadResponse.status !== 'ok') {
      throw new Error(`Upload failed: ${JSON.stringify(uploadResponse)}`)
    }

    return uploadResponse.data
  }

  async deleteUpload(upload: GoFileUpload): Promise<GoFileDeleteUploadResponse> {
    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${upload.guestToken}`,
      },
      body: JSON.stringify({ contentsId: upload.parentFolder }),
    }

    const response = await fetch('https://api.gofile.io/contents', options)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    
    const deleteUploadResponse = await response.json() as GoFileDeleteUploadResponse
    if (deleteUploadResponse.status !== 'ok') {
      throw new Error(`Upload deletion failed: ${JSON.stringify(deleteUploadResponse)}`)
    }

    return deleteUploadResponse
  }

  async setExpiration(upload: GoFileUpload, expirationTimestampMS: number): Promise<GoFileExpiryInfo> {
    const expirationTimestampSec = Math.floor(expirationTimestampMS / 1000)
    
    const options: RequestInit = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${upload.guestToken}`,
      },
      body: JSON.stringify({
        attribute: 'expiry',
        attributeValue: expirationTimestampSec
      })
    }

    const response = await fetch(`https://api.gofile.io/contents/${upload.parentFolder}/update`, options)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const setExpiryResJson = await response.json() as GoFileUpdateExpiryResponse
    if (setExpiryResJson.status !== 'ok') {
      throw new Error(`Setting expiry failed: ${JSON.stringify(setExpiryResJson)}`)
    }

    return setExpiryResJson.data
  }

  async createGuestAccount(): Promise<GoFileGuestAccountInfo> {
    const response = await fetch('https://api.gofile.io/accounts', { method: 'POST' })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const createGuestAccountResponse = await response.json() as GoFileGuestAccountResponse
    if (createGuestAccountResponse.status !== 'ok') {
      throw new Error(`Creating guest account failed: ${JSON.stringify(createGuestAccountResponse)}`)
    }

    return createGuestAccountResponse.data
  }

  async getFolderContents(folderID: GoFileFolderID, accountToken: GoFileAccountToken): Promise<GoFileContentsInfo> {
    const options = {
      method: 'GET',
      headers: { Authorization: `Bearer ${accountToken}` }
    }

    const response = await fetch(`https://api.gofile.io/contents/${folderID}?wt=4fd6sg89d7s6`, options)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const contentsResponse = await response.json() as GoFileContentsResponse
    if (contentsResponse.status !== 'ok') {
      throw new Error(`Fetching folder contents failed: ${JSON.stringify(contentsResponse)}`)
    }

    return contentsResponse.data
  }
}

export const goFileClient = new GoFileClient()
