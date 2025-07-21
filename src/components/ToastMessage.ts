import type { ToastType, ToastOptions } from '../types'

import CheckmarkCircle from '../../node_modules/@fluentui/svg-icons/icons/checkmark_circle_20_regular.svg'
import ErrorCircle from '../../node_modules/@fluentui/svg-icons/icons/error_circle_20_regular.svg'
import Info from '../../node_modules/@fluentui/svg-icons/icons/info_20_regular.svg'
import Warning from '../../node_modules/@fluentui/svg-icons/icons/warning_20_regular.svg'
import SpinnerIos from '../../node_modules/@fluentui/svg-icons/icons/spinner_ios_20_regular.svg'

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
  private iconElem: HTMLDivElement  
  private titleElem: HTMLSpanElement
  private descriptionElem: HTMLSpanElement

  private _options?: ToastOptions

  constructor() {
    super()
    
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          background: hsl(0, 0%, 24%);
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
        .hidden {
          display: none;
        }
      </style>
      <div class="column">
        <div class="icon">✓</div>
      </div>
      <div class="column">
        <span class="title">File uploaded successfully</span>
        <span class="description">Uploaded test1.txt</span>
      </div>
    `

    this.iconElem = shadow.querySelector('.icon')!
    this.titleElem = shadow.querySelector('.title')!
    this.descriptionElem = shadow.querySelector('.description')!
  }

  connectedCallback() {
  }

  private render() {
    if (!this._options) return

    // Set icon size
    const iconSize = '3rem'
    this.iconElem.style.setProperty('--iconSize', iconSize)

    const type: ToastType = this._options.type ?? 'info'
    this.iconElem.innerHTML = ToastIcon[type]
    this.iconElem.style.setProperty('--iconColor', ToastColor[type])
    this.iconElem.classList.toggle('spinner', type === 'loading')

    this.titleElem.textContent = this._options.title
    this.descriptionElem.textContent = this._options.description ?? ''
  }

  set options(options: ToastOptions) {
    this._options = options
    this.render()
  }
}

customElements.define('toast-message', ToastMessage)
