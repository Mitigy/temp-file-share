import { goFileClient } from './GoFileClient'
import { isValidFile, isValidExpiryType, getExpirationTimestamp, parseAndValidateShareHash } from './utils'
import './components/UploadCard'
import './components/SpinningThrobber'
import './components/UploadsWrapper'
import './components/ToastsContainer'
import type { SpinningThrobber } from './components/SpinningThrobber'
import type { UploadsWrapper } from './components/UploadsWrapper'

// #region DOM Elements
const fileUploadForm = document.getElementById('file-upload-form') as HTMLFormElement
const expiryInput = document.getElementById('expiry-input') as HTMLInputElement
const customRadio = document.getElementById('expiryCustom') as HTMLInputElement
const fileUploadSubmitButton = document.getElementById('file-upload-submit') as HTMLButtonElement
const throbber = document.getElementById('spinning-throbber') as SpinningThrobber

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
    if (typeof expiryCustomValue !== 'string' || expiryCustomValue.trim() === '') {
      console.error('Custom expiry value must be a non-empty string when expiry type is custom.')
      return
    }
    const customDate = new Date(expiryCustomValue)
    if (isNaN(customDate.getTime())) {
      console.error('Invalid date for custom expiry value.')
      return
    }
    expirationTimestampMS = getExpirationTimestamp('custom', customDate)
  }else {
    expirationTimestampMS = getExpirationTimestamp(expiryType)
  }

  // Ensure the expiry timestamp is in the future
  if (expirationTimestampMS <= Date.now()) {
    console.error('Expiry timestamp must be in the future.')
    return
  }

  // Validate file
  if (!isValidFile(file)) {
    console.error('Invalid file selected for upload.')
    return
  }

  // Show a throbber and disable the form while uploading
  setUploadButtonState(fileUploadSubmitButton, true)
  throbber.show()

  // Upload file and set expiry
  const goFileUpload = await goFileClient.uploadFile(file)
  await goFileClient.setExpiration(goFileUpload, expirationTimestampMS)

  // A new guest account is created for downloaders so
  // they cannot adjust the file (such as deleting it)
  const guestAccount = await goFileClient.createGuestAccount()

  // The direct download link is not usable until the token that
  // will be used to access the file gets the folder contents
  const folderContents = await goFileClient.getFolderContents(goFileUpload.parentFolder, guestAccount.token)

  // Get the direct download link for the child with the same ID as the uploaded file
  if (!folderContents.children || !folderContents.children[goFileUpload.id]) {
    console.error('File not found in folder contents.')
    return
  }

  const directDownloadLink = folderContents.children[goFileUpload.id].link
  console.log(`File uploaded successfully! Direct Download Link: ${directDownloadLink}\nGuest Token: ${guestAccount.token}`)

  // Create Upload Card
  uploadsWrapper.addUploadCard({
    fileName: goFileUpload.name,
    directDownloadLink,
    guestToken: guestAccount.token,
    expirationTimestampMS,
    goFileUpload
  })

  // Clean up the form and hide the throbber
  setUploadButtonState(fileUploadSubmitButton, false)
  fileUploadForm.reset()
  throbber.hide()
}

if (location.hash) {
  try {
    // Extract just the Base64 part of the hash and decode it
    const uploadCardData = parseAndValidateShareHash(location.hash.slice(1))
    
    uploadsWrapper.addUploadCard(uploadCardData)
  } catch (e) {
    console.error('Error with share link:', e)
    alert('Invalid share link.')
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
