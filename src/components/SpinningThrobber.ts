export class SpinningThrobber extends HTMLElement {
  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          background: rgba(0,0,0,0.4);
          inset: 0;
          z-index: 9999;
        }
        :host(.hidden) {
          display: none;
        }
        .spinner {
          border: 8px solid #eee;
          border-top: 8px solid #333;
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      </style>
      <div class="spinner"></div>
    `
  }

  show() {
    this.classList.remove('hidden')
  }

  hide() {
    this.classList.add('hidden')
  }
}

customElements.define('spinning-throbber', SpinningThrobber)
