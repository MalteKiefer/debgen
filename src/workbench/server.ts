import { renderToString } from '@vue/server-renderer'
import { createSSRApp } from 'vue'
import App from './App.vue'
import { escapeJsonForHtml } from '../site/render'
import type { WorkbenchHydrationPayload } from './types'

export interface RenderedWorkbenchApp {
  readonly html: string
  readonly serializedState: string
}

export async function renderWorkbenchApp(
  context: WorkbenchHydrationPayload,
): Promise<RenderedWorkbenchApp> {
  const app = createSSRApp(App, { initialState: context })
  return {
    html: await renderToString(app),
    serializedState: escapeJsonForHtml(context),
  }
}
