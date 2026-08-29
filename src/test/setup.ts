import { config } from '@vue/test-utils'
import { afterEach, beforeEach } from 'vitest'
import { i18n, setLocale } from '../i18n'

config.global.plugins = [i18n]

beforeEach(() => {
  setLocale('de', { document: null, storage: null })
})

class ResizeObserverPolyfill {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverPolyfill,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(globalThis, 'visualViewport', {
  writable: true,
  value: {
    width: 1024,
    height: 768,
    scale: 1,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  },
})

afterEach(() => {
  document.body.innerHTML = ''
})
