//Supports only horizontal tabs for now.

export class TabsElement extends HTMLElement {
  constructor() {super()}

  get orientation() {return this.getAttribute('aria-orientation')}
  get activation() {return this.getAttribute('activation')}
  get tabs() {return Array.from(this.querySelectorAll('button'))}
  panel(tab) {return document.getElementById(tab.value)}
  #select(tab) {
    const id = tab.value
    this.tabs.forEach(tab => {
      const panel = this.panel(tab)
      const isSelected = panel.id === id
      tab.setAttribute('aria-selected', isSelected)
      tab.setAttribute('tabindex', (!isSelected * -1).toString()) //0 if isSelected is true, -1 if false
      panel.hidden = !isSelected
    })
  }

  #handleClick = e => this.#select(e.target.closest('button'))
  #handleKey = e => {
    const orientation = this.orientation
    const nextKey = orientation === 'vertical' && e.key === 'ArrowDown' || e.key === 'ArrowRight'
    const prevKey = orientation === 'vertical' && e.key === 'ArrowUp' || e.key === 'ArrowLeft'
    if (!nextKey && !prevKey) return

    const tabs = this.tabs
    const tab = e.target.closest('button')
    const index = tabs.indexOf(tab)
    let nextTab
    if (nextKey) {
      nextTab = tabs[index + 1] || tabs[0] //find next tab or first
    } else if (prevKey) {
      nextTab = tabs[index - 1] || tabs[tabs.length - 1] //find prev tab or last
    }
    nextTab.focus()
    if (this.activation !== 'manual') {
      this.#select(nextTab)
    }
  }

  #listen() {
    this.addEventListener('click', this.#handleClick)
    this.addEventListener('keydown', this.#handleKey)
  }
  #unlisten() {
    this.removeEventListener('click', this.#handleClick)
    this.removeEventListener('keydown', this.#handleKey)
  }

  #setup() {
    //TODO: enforce having a label by aria-labelledby or aria-label
    //TODO: wait for domready before setting stuff for content
    this.setAttribute('role', 'tablist')
    const tabs = this.tabs
    tabs.forEach(tab => {
      const id = tab.value
      tab.setAttribute('type', 'button')
      tab.setAttribute('aria-role', 'tab')
      tab.setAttribute('aria-controls', id)
      tab.id ??= id + '-tab'
      tab.setAttribute('tabindex', '-1')
      const panel = this.panel(tab)
      panel.setAttribute('role', 'tabpanel')
      panel.setAttribute('aria-labelledby', tab.id)
      panel.setAttribute('tabindex', '0')
    })
    this.#select(tabs[0])
    this.#listen()
  }

  connectedCallback() {
    if (document.readyState !== 'complete') {
      document.addEventListener('DOMContentLoaded', () => {
        this.#setup()
      })
    } else {
      this.#setup()
    }
  }
  disconnectedCallback() {
    this.#unlisten()
  }
  adoptedCallback() {
    this.#unlisten()
    this.#listen()
  }
}