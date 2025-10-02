import { goFileClient } from '../GoFileClient'
import type { UploadCardData } from '../types'
import { createShareLink } from '../utils'
import type { SpinningThrobber } from './SpinningThrobber'
import type { ToastsContainer } from './ToastsContainer'
import type { UploadCard } from './UploadCard'

const throbber = document.getElementById('spinning-throbber') as SpinningThrobber
const toastsContainer = document.getElementById('toasts-container') as ToastsContainer

export class UploadsWrapper extends HTMLElement {
  private uploadsList: HTMLDivElement
  private noUploadsWrapper: HTMLDivElement

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        .uploadsList {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .hidden {
          display: none;
        }
      </style>
      <div class="uploadsList"></div>
      <div class="no-uploads">
        <p>No file uploaded yet.</p>
      </div>
    `

    this.uploadsList = shadow.querySelector('.uploadsList')!
    this.noUploadsWrapper = shadow.querySelector('.no-uploads')!
  }

  private updateNoUploadsVisibility(): void {
    this.noUploadsWrapper.classList.toggle('hidden', this.uploadsList.children.length > 0)
  }

  private removeCard(card: UploadCard): void {
    card.remove()
    this.updateNoUploadsVisibility()
  }

  addUploadCard(cardData: UploadCardData): void {
    const {
      fileName,
      directDownloadLink,
      guestToken,
      expirationTimestampMS,
      goFileUpload
    } = cardData

    const card = document.createElement('upload-card') as UploadCard
    card.fileName = fileName
    card.received = !goFileUpload
    card.expiry = expirationTimestampMS

    // Create the share link
    const shareLink = createShareLink({
      fileName,
      directDownloadLink,
      guestToken,
      expirationTimestampMS
    })

    // #region Listen for events on the card
    // Only add delete event listener if upload is provided (not from link)
    if (goFileUpload) {
      card.addEventListener('delete', async () => {
        // Create a toast to reuse and disable the card
        const fileDeleteToast = toastsContainer.addToastMessage({
          type: 'loading',
          title: 'Deleting File...',
          description: `Attempting to delete file "${fileName}"...`
        })
        card.disabled = true

        let successfullyDeleted = false

        try {
          await goFileClient.deleteUpload(goFileUpload)
          this.removeCard(card)
          successfullyDeleted = true
        } catch (error) {
          console.error('Error deleting file:', error)
          fileDeleteToast.options = {
            type: 'failure',
            title: 'File Deletion Error',
            description: `Failed to delete file "${fileName}". Please try again.`
          }
        }
        
        // Re-enable the card
        card.disabled = false
        
        if (successfullyDeleted) {
          fileDeleteToast.options = {
            type: 'success',
            title: 'File Deleted',
            description: `The file "${fileName}" has been deleted successfully.`
          }
        }
      })
    }

    card.addEventListener('download', async () => {
      // Show a throbber while downloading
      throbber.show()

      try {
        const response = await fetch(directDownloadLink, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${guestToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`)
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading file:', error)
        toastsContainer.addToastMessage({
          type: 'failure',
          title: 'File Download Error',
          description: `Failed to download file "${fileName}". Please try again.`
        })
      }

      // Hide the throbber after download
      throbber.hide()
    })

    card.addEventListener('copy', () => {
      navigator.clipboard.writeText(shareLink)
      .then(() => {
        toastsContainer.addToastMessage({
          type: 'success',
          title: 'Link Copied',
          description: 'File link copied to clipboard!'
        })
      })
      .catch(err => {
        toastsContainer.addToastMessage({
          type: 'failure',
          title: 'Link Copy Error',
          description: 'Failed to copy file link. Please try again.'
        })
        console.error('Failed to copy file link:', err)
      })
    })

    card.addEventListener('share', () => {
      const shareData = {
        title: `Temp File Share\nDownload the file ${fileName}`,
        url: shareLink
      }

      navigator.share(shareData)
        .then(() => toastsContainer.addToastMessage({
          type: 'success',
          title: 'Link Shared',
          description: 'File link shared successfully!'
        }))
        .catch(error => {
          console.error('Error sharing:', error)
          toastsContainer.addToastMessage({
            type: 'failure',
            title: 'Link Share Error',
            description: 'Failed to share file link. Please try again.'
          })
        })
    })
    // #endregion
    
    this.uploadsList.appendChild(card)
    this.updateNoUploadsVisibility()
  }
}

customElements.define('uploads-wrapper', UploadsWrapper)
