import { goFileClient } from '../GoFileClient'
import type { UploadCardData } from '../types'
import { createShareLink } from '../utils'
import type { SpinningThrobber } from './SpinningThrobber'
import type { UploadCard } from './UploadCard'

const throbber = document.getElementById('spinning-throbber') as SpinningThrobber

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

    // #region Listen for events on the card
    // Only add delete event listener if upload is provided (not from link)
    if (goFileUpload) {
      card.addEventListener('delete', async () => {
        // Show a throbber while deleting
        throbber.show()

        try {
          await goFileClient.deleteUpload(goFileUpload)
          this.removeCard(card)

        } catch (error) {
          console.error('Error deleting file:', error)
          alert('Failed to delete file. Please try again.')
        }

        // Hide the throbber after deletion
        throbber.hide()
        console.log('File deleted successfully.')
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
        alert('Failed to download file. Please try again.')
      }

      // Hide the throbber after download
      throbber.hide()
    })

    card.addEventListener('copy', () => {
      const shareLink = createShareLink({
        fileName,
        directDownloadLink,
        guestToken,
        expirationTimestampMS
      })

      navigator.clipboard.writeText(shareLink)
      .then(() => {
        console.log('File link copied to clipboard.')
        alert('File link copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy file link:', err)
        alert('Failed to copy file link. Please try again.')
      })
    })

    card.addEventListener('share', () => {
      const shareData = {
        title: `Temp File Share\nDownload the file ${fileName}`,
        url: createShareLink({
          fileName,
          directDownloadLink,
          guestToken,
          expirationTimestampMS
        })
      }

      navigator.share(shareData)
        .then(() => console.log('Share successful'))
        .catch(error => console.error('Error sharing:', error))
    })
    // #endregion
    
    this.uploadsList.appendChild(card)
    console.log(`Added upload card for: ${fileName}`)
    this.updateNoUploadsVisibility()

    // Remove the card after the expiry time
    // setTimeout(() => {
    //   this.removeCard(card)
    // }, expirationTimestamp - Date.now())
  }
}

customElements.define('uploads-wrapper', UploadsWrapper)
