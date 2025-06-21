export class UploadCard extends HTMLElement {
  private cardElem: HTMLDivElement
  private fileNameElem: HTMLSpanElement
  private receivedBadge: HTMLSpanElement
  private extensionElem: HTMLSpanElement
  private expiryDateElem: HTMLSpanElement
  private deleteBtn: HTMLButtonElement
  private downloadBtn: HTMLButtonElement
  private copyBtn: HTMLButtonElement
  private shareBtn: HTMLButtonElement

  constructor() {
    super()
    
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        .card {
          background: hsl(0, 0%, 24%);
          padding: 1rem;
          border-radius: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: max-content;
          min-width: 14rem;
          max-width: 22rem;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .file-name {
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
        .file-ext {
          color: #aaa;
        }
        .displayBlock {
          display: block;
        }
        .received-badge {
          background: #333;
          border-radius: 0.25em;
          padding: 0 0.5em;
          display: inline-block;
        }
        .hidden {
          display: none;
        }
        .expired {
          opacity: 0.5;
        }
        .expired-message {
          display: none;
          color: tomato;
          font-weight: bold;
        }
        .card.expired .expired-message {
          display: block;
        }
        .card.expired .expiry-date {
          display: none;
        }
      </style>
      <div class="card">
        <div class="row">
          <span class="file-name"></span>
          <span class="received-badge">From Link</span>
          <button class="delete-file-btn">Delete</button>
        </div>
        <div class="row displayBlock">
          <span>File Extension:</span>
          <span class="file-ext"></span>
        </div>
        <div class="row">
          <span class="expiry-date"></span>
          <span class="expired-message">Expired</span>
        </div>
        <div class="row">
          <button class="download-btn">Download</button>
          <div>
            <button class="copy-link-btn">Copy Link</button>
            <button class="share-btn">Share</button>
          </div>
        </div>
      </div>
    `

    console.log(shadow.querySelector('.card'))
    this.cardElem = shadow.querySelector('.card')!
    this.fileNameElem = shadow.querySelector('.file-name')!
    this.receivedBadge = shadow.querySelector('.received-badge')!
    this.extensionElem = shadow.querySelector('.file-ext')!
    this.expiryDateElem = shadow.querySelector('.expiry-date')!
    this.deleteBtn = shadow.querySelector('.delete-file-btn')!
    this.downloadBtn = shadow.querySelector('.download-btn')!
    this.copyBtn = shadow.querySelector('.copy-link-btn')!
    this.shareBtn = shadow.querySelector('.share-btn')!
  }

  connectedCallback() {
    // Disable share button and add tooltip if the Web Share API is not supported
    // if the card isn't expired
    if (!navigator.share && !this.cardElem.classList.contains('expired')) {
      this.shareBtn.disabled = true
      this.shareBtn.title = 'Web Share API not supported'
    }

    // Dispatch custom events for actions
    this.deleteBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('delete', { bubbles: true }))
    })
    
    this.downloadBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('download', { bubbles: true }))
    })
    
    this.copyBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('copy', { bubbles: true }))
    })

    this.shareBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('share', { bubbles: true }))
    })
  }

  private setExpiredState() {
    console.log(this.cardElem)
    this.cardElem.classList.add('expired')

    this.deleteBtn.disabled = true
    this.downloadBtn.disabled = true
    this.copyBtn.disabled = true
    this.shareBtn.disabled = true

    if (!navigator.share) { // Clear the unsupported title so only the card title shows
      this.shareBtn.title = ''
    }
    this.cardElem.title = 'This file has expired'
  }

  set fileName(name: string) {
    this.fileNameElem.textContent = name
    this.extensionElem.textContent = name.split('.').pop() ?? 'unknown'
  }

  set received(isReceived: boolean) {
    this.deleteBtn.classList.toggle('hidden', isReceived)
    this.receivedBadge.classList.toggle('hidden', !isReceived)
  }

  set expiry(expirationTimestampMS: number) {
    const now = Date.now()
    if (now >= expirationTimestampMS) {
      this.setExpiredState()
      return
    }

    const expiryDate = new Date(expirationTimestampMS)
    const formattedDate = expiryDate.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    this.expiryDateElem.textContent = `Expires: ${formattedDate}`
    setTimeout(() => this.setExpiredState(), expirationTimestampMS - now)
  }
}

customElements.define('upload-card', UploadCard)
