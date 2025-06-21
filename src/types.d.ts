// Generic types for GoFile API responses
export type GoFileAccountToken = string
export type GoFileFolderID = string
export type GoFileExpirationTimestamp = number

// File upload types
export type GoFileUpload = {
  createTime: number
  downloadPage: string
  guestToken: GoFileAccountToken
  id: string
  md5: string
  mimetype: string
  modTime: number
  name: string
  parentFolder: GoFileFolderID
  parentFolderCode: string
  servers: string[]
  size: number
  type: string
}

export type GoFileUploadResponse = {
  status: string
  data: GoFileUpload
}

// Expiry types
export type ExpiryDuration = '10min' | '1hour' | '1day' | '7days'
export type ExpiryType = ExpiryDuration | 'custom'

export type GoFileExpiryInfo = {
  id: GoFileFolderID
  type: string
  name: string
  createTime: number
  modTime: number
  parentFolder: GoFileFolderID
}

export type GoFileUpdateExpiryResponse = {
  status: string
  data: GoFileExpiryInfo
}

// Upload deletion types
export type GoFileDeleteUploadResponse = {
  status: string
  data: {
    [folderId: GoFileFolderID]: {
      status: string
      data: {}
    }
  }
}

// Guest account types
export type GoFileGuestAccountInfo = {
  id: string
  rootFolder: GoFileFolderID
  tier: string
  token: GoFileAccountToken
}

export type GoFileGuestAccountResponse = {
  status: string
  data: GoFileGuestAccountInfo
}

// Folder contents types
export type GoFileContentsResponse = {
  status: string
  data: GoFileContentsInfo
}

export type GoFileContentsInfo = {
  canAccess: boolean
  isOwner?: boolean
  id: string
  type: 'file' | 'folder'
  name: string
  createTime: number
  modTime: number
  parentFolder?: string
  code: string
  public: boolean
  expire?: number
  totalDownloadCount: number
  totalSize: number
  childrenCount: number
  children: {
    [contentId: string]: {
      canAccess: boolean
      isOwner?: boolean
      id: string
      parentFolder: GoFileFolderID
      type: 'file' | 'folder'
      name: string
      createTime: number
      modTime: number
      lastAccess?: number
      size: number
      downloadCount: number
      md5: string
      mimeType: string
      servers: string[]
      serverSelected: string
      link: string
    }
  }
  metadata: {
    totalCount?: number
    totalPages?: number
    page?: number
    pageSize?: number
    hasNextPage?: boolean
  }
}

// The data structure for upload cards
export type UploadCardData = {
  fileName: string
  directDownloadLink: string
  guestToken: string
  expirationTimestampMS: number
  goFileUpload?: GoFileUpload
}
