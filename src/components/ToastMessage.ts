import type { ToastType, ToastOptions } from '../types'

import CheckmarkCircle from '../../node_modules/@fluentui/svg-icons/icons/checkmark_circle_20_regular.svg'
import ErrorCircle from '../../node_modules/@fluentui/svg-icons/icons/error_circle_20_regular.svg'
import Info from '../../node_modules/@fluentui/svg-icons/icons/info_20_regular.svg'
import Warning from '../../node_modules/@fluentui/svg-icons/icons/warning_20_regular.svg'
import SpinnerIos from '../../node_modules/@fluentui/svg-icons/icons/spinner_ios_20_regular.svg'
import Dismiss from '../../node_modules/@fluentui/svg-icons/icons/dismiss_20_regular.svg'

const ToastIcon = {
  success: CheckmarkCircle,
  failure: ErrorCircle,
  info: Info,
  warning: Warning,
  loading: SpinnerIos
} as const
type ToastIcon = typeof ToastIcon[keyof typeof ToastIcon]

const ToastColor = {
  success: '#107C10',
  failure: '#C50F1F',
  info: '#007FFF',
  warning: '#FFC107',
  loading: '#6C757D'
} as const
type ToastColor = typeof ToastColor[keyof typeof ToastColor]

export class ToastMessage extends HTMLElement {
  private primaryIconElem: HTMLDivElement  
  private titleElem: HTMLSpanElement
  private descriptionElem: HTMLSpanElement
  private dismissElem: HTMLButtonElement
  private hostElem: ToastMessage

  private _options?: ToastOptions
  private timedDismissalTimeout?: number

  private static readonly AUTO_DISMISS_DELAY_MS = 7000

  constructor() {
    super()
    
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          background: #323130;
          padding: 1rem;
          border-radius: 0.5rem;
          display: flex;
          gap: 0.5rem;
          width: 18rem;
        }
        .column {
          display: flex;
          flex-direction: column;
        }
        .icon {
          display: block;
        }
        .primaryIcon {
          width: var(--iconSize);
          height: var(--iconSize);
          fill: var(--iconColor);
        }
        .icon svg {
          width: 100%;
          height: 100%;
        }
        
        .icon.spinner svg {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .title {
          font-weight: bold;
        }

        .dismiss {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-left: auto;
          fill: white;
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
        }
        .dismiss:hover {
          background-color: #3b3a39;
        }
        .dismiss:active {
          background-color: #605e5c;
        }
        .dismiss svg {
          width: calc(100% - 10px);
          height: calc(100% - 10px);
        }

        .hidden {
          display: none;
        }
      </style>
      <div class="column">
        <div class="icon primaryIcon">✓</div>
      </div>
      <div class="column">
        <span class="title">File uploaded successfully</span>
        <span class="description">Uploaded test1.txt</span>
      </div>
      <button class="dismiss" aria-label="Dismiss toast">
        <div class="icon">${Dismiss}</div>
      </button>
    `

    this.primaryIconElem = shadow.querySelector('.primaryIcon')!
    this.titleElem = shadow.querySelector('.title')!
    this.descriptionElem = shadow.querySelector('.description')!
    this.dismissElem = shadow.querySelector('.dismiss')!
    this.hostElem = shadow.host as ToastMessage
  }

  // Called each time the element is added to the document
  connectedCallback() {
    // Clear the dismissal timer when the user hovers over the toast
    this.hostElem.addEventListener('mouseenter', () => {
      this.cancelTimedDismissal()
    })

    // Set a new dismissal timer when the user stops hovering
    this.hostElem.addEventListener('mouseleave', () => {
      if (this.shouldAutoDismiss()) {
        this.setTimedDismissal()
      }
    })

    // Dismiss the toast when the dismiss button is clicked
    this.dismissElem.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true }))
    })
  }

  // Called each time the element is removed from the document.
  disconnectedCallback() {
    this.cancelTimedDismissal()
  }

  private render() {
    if (!this._options) return

    // Set icon size
    const iconSize = '3rem'
    this.primaryIconElem.style.setProperty('--iconSize', iconSize)

    const type: ToastType = this._options.type ?? 'info'
    this.primaryIconElem.innerHTML = ToastIcon[type]
    this.primaryIconElem.style.setProperty('--iconColor', ToastColor[type])
    this.primaryIconElem.classList.toggle('spinner', type === 'loading')

    this.titleElem.textContent = this._options.title
    this.descriptionElem.textContent = this._options.description ?? ''

    // If the toast will auto-dismiss, hide the dismiss button
    this.dismissElem.classList.toggle('hidden', this.shouldAutoDismiss())
  }

  private shouldAutoDismiss(): boolean {
    // Only auto-dismiss success toasts
    return this._options?.type === 'success'
  }

  private cancelTimedDismissal() {
    // Clear the timer if it exists
    if (this.timedDismissalTimeout) {
      clearTimeout(this.timedDismissalTimeout)
      this.timedDismissalTimeout = undefined
    }
  }

  private setTimedDismissal(delay: number = ToastMessage.AUTO_DISMISS_DELAY_MS) {
    // If a timer is already set, clear it
    this.cancelTimedDismissal()

    this.timedDismissalTimeout = setTimeout(() => {
      this.remove()
    }, delay)
  }

  set options(options: ToastOptions) {
    this._options = options
    this.render()

    // Automatically remove success toasts after 7 seconds (https://fluent2.microsoft.design/components/web/react/core/toast/usage#timed-dismissal)
    if (this.shouldAutoDismiss()) {
      this.setTimedDismissal()
    }
  }
}

customElements.define('toast-message', ToastMessage)
