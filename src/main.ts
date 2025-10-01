import { goFileClient } from './GoFileClient'
import { isValidFile, isValidExpiryType, getExpirationTimestamp, parseAndValidateShareHash } from './utils'
import './components/UploadCard'
import './components/SpinningThrobber'
import './components/UploadsWrapper'
import './components/ToastsContainer'
import type { SpinningThrobber } from './components/SpinningThrobber'
import type { UploadsWrapper } from './components/UploadsWrapper'
import type { ToastsContainer } from './components/ToastsContainer'
import type { GoFileContentsInfo, GoFileGuestAccountInfo, GoFileUpload, UploadCardData } from './types'

// #region DOM Elements
const fileUploadForm = document.getElementById('file-upload-form') as HTMLFormElement
const expiryInput = document.getElementById('expiry-input') as HTMLInputElement
const customRadio = document.getElementById('expiryCustom') as HTMLInputElement
const fileUploadSubmitButton = document.getElementById('file-upload-submit') as HTMLButtonElement
const throbber = document.getElementById('spinning-throbber') as SpinningThrobber
const toastsContainer = document.getElementById('toasts-container') as ToastsContainer
// Uploaded file card elements
const uploadsWrapper = document.getElementById('uploads-wrapper') as UploadsWrapper
// #endregion

const setUploadButtonState = (submitButton: HTMLButtonElement, isUploading: boolean) => {
  submitButton.disabled = isUploading
  submitButton.textContent = isUploading ? 'Uploading...' : 'Upload'
}

// Handlers
const handleFormSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault()

  const formData = new FormData(fileUploadForm)
  const expiryType = formData.get('expiryType')
  const expiryCustomValue = formData.get('expiryCustomValue')
  const file = formData.get('file')

  // Validate expiry type
  if (!isValidExpiryType(expiryType)) {
    console.error('Invalid expiry type.')
    return
  }

  // For custom expiry, ensure the value is a valid
  // date string and convert it to a timestamp
  // For other expiry types, call getExpirationTimestamp with the type
  let expirationTimestampMS: number
  if (expiryType === 'custom') {
    if (typeof expiryCustomValue !== 'string') {
      console.error('The custom expiry date must be a string.')
      return
    }

    if (expiryCustomValue.trim() === '') {
      toastsContainer.addToastMessage({
        type: 'warning',
        title: 'Missing Custom Expiry Date',
        description: 'Please enter a valid date for custom expiry.'
      })
      return
    }
    const customDate = new Date(expiryCustomValue)
    if (isNaN(customDate.getTime())) {
      toastsContainer.addToastMessage({
        type: 'warning',
        title: 'Invalid Date',
        description: 'Please enter a valid date for custom expiry.'
      })
      return
    }
    expirationTimestampMS = getExpirationTimestamp('custom', customDate)
  }else {
    expirationTimestampMS = getExpirationTimestamp(expiryType)
  }

  // Ensure the expiry timestamp is in the future
  if (expirationTimestampMS <= Date.now()) {
    toastsContainer.addToastMessage({
      type: 'warning',
      title: 'Invalid Expiry Date',
      description: 'Expiry timestamp must be in the future.'
    })
    return
  }

  // Validate file
  if (!isValidFile(file)) {
    toastsContainer.addToastMessage({
      type: 'warning',
      title: 'Invalid File',
      description: 'Invalid file selected for upload.'
    })
    return
  }

  // Show a throbber and disable the form while uploading
  setUploadButtonState(fileUploadSubmitButton, true)
  throbber.show()

  let goFileUpload: GoFileUpload | undefined
  let guestAccount: GoFileGuestAccountInfo | undefined
  let folderContents: GoFileContentsInfo | undefined
  let successfulUpload = false

  try {
    // Upload file and set expiry
    goFileUpload = await goFileClient.uploadFile(file)
    await goFileClient.setExpiration(goFileUpload, expirationTimestampMS)

    // A new guest account is created for downloaders so
    // they cannot adjust the file (such as deleting it)
    guestAccount = await goFileClient.createGuestAccount()

    // The direct download link is not usable until the token that
    // will be used to access the file gets the folder contents
    folderContents = await goFileClient.getFolderContents(goFileUpload.parentFolder, guestAccount.token)

    // Get the direct download link for the child with the same ID as the uploaded file
    if (!folderContents.children || !folderContents.children[goFileUpload.id]) {
      toastsContainer.addToastMessage({
        type: 'failure',
        title: 'Upload Error',
        description: 'File not found in folder contents. Please try again.'
      })
      return
    }

    successfulUpload = true
  } catch (error) {
    console.error('Error during file upload or setting expiration:', error)
    toastsContainer.addToastMessage({
      type: 'failure',
      title: 'Upload Failed',
      description: 'An error occurred during file upload. Please try again.'
    })
  }

  if (successfulUpload && goFileUpload && guestAccount && folderContents) {
    const directDownloadLink = folderContents.children[goFileUpload.id].link
    toastsContainer.addToastMessage({
      type: 'success',
      title: 'Upload Successful',
      description: `File "${goFileUpload.name}" uploaded successfully!`
    })

    // Create Upload Card
    uploadsWrapper.addUploadCard({
      fileName: goFileUpload.name,
      directDownloadLink,
      guestToken: guestAccount.token,
      expirationTimestampMS,
      goFileUpload
    })

    fileUploadForm.reset()
  }

  setUploadButtonState(fileUploadSubmitButton, false)
  throbber.hide()
}

if (location.hash) {
  let uploadCardData: UploadCardData | undefined
  
  try {
    // Extract just the Base64 part of the hash and decode it
    uploadCardData = parseAndValidateShareHash(location.hash.slice(1))
  } catch (e) {
    console.error('Error with share link:', e)
    toastsContainer.addToastMessage({
      type: 'failure',
      title: 'Invalid Share Link',
      description: 'The share link is invalid. Please check the link.'
    })
  }

  if (uploadCardData) {
    uploadsWrapper.addUploadCard(uploadCardData)
  }
}

// Check the custom radio button on when the date input is focused
expiryInput.addEventListener('focus', () => {
  customRadio.checked = true
})
  

fileUploadForm.addEventListener('submit', handleFormSubmit)

// uploadsWrapper.addUploadCard({
//   fileName: 'Example File.txt',
//   directDownloadLink: 'https://example.com/download',
//   guestToken: 'example-guest-token',
//   expirationTimestampMS: Date.now() + 5 * 1000, // 30 seconds from now
//   goFileUpload: {
//     id: 'example-id',
//     name: 'Example File.txt',
//     parentFolder: 'example-folder-id',
//     size: 123456,
//     createTime: Date.now(),
//     modTime: Date.now(),
//     md5: 'example-md5',
//     servers: ['example-server'],
//     downloadPage: 'https://example.com/download-page',
//     guestToken: 'example-guest-token',
//     mimetype: 'text/plain',
//     parentFolderCode: 'example-folder-code',
//     type: 'file'
//   }
// })
