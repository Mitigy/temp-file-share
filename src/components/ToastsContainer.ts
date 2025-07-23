import type { ToastOptions } from '../types'
import { ToastMessage } from './ToastMessage'

export class ToastsContainer extends HTMLElement {
  private toastsList: HTMLUListElement

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 1rem;
          right: 1rem;
          pointer-events: none;
        }
        .toastsList {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0;
          margin: 0;
        }
        .toastListItem {
          pointer-events: auto;
          list-style: none;
        }
        .toastsList > .toastListItem {
          pointer-events: auto;
        }
      </style>
      <ul class="toastsList"></ul>
    `

    this.toastsList = shadow.querySelector('.toastsList')!
  }

  addToastMessage(options: ToastOptions): ToastMessage {
    const li = document.createElement('li')
    li.className = 'toastListItem'

    const toastMessage = document.createElement('toast-message') as ToastMessage
    toastMessage.options = options

    // Remove the toast message when it is dismissed
    toastMessage.addEventListener('dismiss', () => {
      this.removeToastMessage(toastMessage)
    })

    li.appendChild(toastMessage)
    this.toastsList.appendChild(li)

    return toastMessage
  }

  removeToastMessage(toast: ToastMessage): void {
    const li = toast.parentElement
    if (li) {
      li.remove()
    }
  }
}

customElements.define('toasts-container', ToastsContainer)
