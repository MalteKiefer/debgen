type PlausibleEventProps = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleEventProps }) => void
  }
}

export function trackEvent(event: string, props?: PlausibleEventProps): void {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return
  window.plausible(event, props ? { props } : undefined)
}
