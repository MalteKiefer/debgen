import { createSSRApp, type App as VueApp } from 'vue'
import WorkbenchApp from './App.vue'
import type { WorkbenchHydrationPayload } from './types'

export function hydrateWorkbench(
  root: Element,
  initialState: WorkbenchHydrationPayload,
): VueApp<Element> {
  const app = createSSRApp(WorkbenchApp, { initialState }) as VueApp<Element>
  app.mount(root)
  if (root instanceof HTMLElement) root.dataset.enhanced = 'true'
  return app
}

const root = typeof document === 'undefined' ? null : document.querySelector('#workbench')
const stateScript = typeof document === 'undefined' ? null : document.querySelector('#workbench-state')

if (root && stateScript?.textContent) {
  hydrateWorkbench(root, JSON.parse(stateScript.textContent) as WorkbenchHydrationPayload)
}
