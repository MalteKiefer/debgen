<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { copyText, downloadText } from '../features/sources/download'
import type { GeneratedArtifact } from '../features/vendors/model'

const props = defineProps<{
  artifacts: readonly GeneratedArtifact[]
}>()

const activeIndex = ref(0)
const feedback = ref<{ kind: 'success' | 'error', message: string } | null>(null)
let feedbackVersion = 0

const activeArtifact = computed(() => props.artifacts[activeIndex.value])

watch(
  () => props.artifacts,
  (artifacts) => {
    if (activeIndex.value >= artifacts.length) activeIndex.value = 0
    feedbackVersion += 1
    feedback.value = null
  },
)

function selectFile(index: number): void {
  activeIndex.value = index
  feedbackVersion += 1
  feedback.value = null
}

function moveFocus(event: KeyboardEvent, index: number): void {
  const lastIndex = props.artifacts.length - 1
  let nextIndex: number | undefined
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = index === lastIndex ? 0 : index + 1
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = index === 0 ? lastIndex : index - 1
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = lastIndex
  if (nextIndex === undefined || nextIndex < 0) return

  event.preventDefault()
  selectFile(nextIndex)
  const tabs = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  tabs?.[nextIndex]?.focus()
}

async function copyArtifact(): Promise<void> {
  const artifact = activeArtifact.value
  if (!artifact) return
  const version = ++feedbackVersion
  feedback.value = null
  try {
    await copyText(artifact.content)
    if (version !== feedbackVersion) return
    feedback.value = { kind: 'success', message: `${artifact.filename} wurde kopiert.` }
  } catch {
    if (version !== feedbackVersion) return
    feedback.value = {
      kind: 'error',
      message: 'Kopieren fehlgeschlagen. Bitte kopiere den Inhalt manuell aus der Vorschau.',
    }
  }
}

function downloadArtifact(): void {
  const artifact = activeArtifact.value
  if (!artifact) return
  feedbackVersion += 1
  feedback.value = null
  try {
    downloadText(artifact.filename, artifact.content)
    feedback.value = { kind: 'success', message: `${artifact.filename} wurde heruntergeladen.` }
  } catch {
    feedback.value = {
      kind: 'error',
      message: 'Herunterladen fehlgeschlagen. Bitte speichere den Inhalt manuell aus der Vorschau.',
    }
  }
}
</script>

<template>
  <section aria-labelledby="generated-files-title" class="generated-files">
    <div class="generated-files__heading">
      <div>
        <p class="review-step__eyebrow">Dateipaket</p>
        <h3 id="generated-files-title">Erzeugte Dateien</h3>
      </div>
      <v-chip prepend-icon="mdi-file-multiple-outline" variant="tonal">
        {{ artifacts.length }} {{ artifacts.length === 1 ? 'Datei' : 'Dateien' }}
      </v-chip>
    </div>

    <div aria-label="Erzeugte Dateien" class="generated-files__tabs" role="tablist">
      <button
        v-for="(artifact, index) in artifacts"
        :id="`file-tab-${index}`"
        :key="artifact.filename"
        :aria-controls="`file-panel-${index}`"
        :aria-selected="activeIndex === index"
        :tabindex="activeIndex === index ? 0 : -1"
        class="generated-files__tab studio-touch-target"
        role="tab"
        type="button"
        @click="selectFile(index)"
        @keydown="moveFocus($event, index)"
      >
        <v-icon aria-hidden="true" icon="mdi-file-code-outline" size="19" />
        {{ artifact.filename }}
      </button>
    </div>

    <article
      v-if="activeArtifact"
      :id="`file-panel-${activeIndex}`"
      :aria-labelledby="`file-tab-${activeIndex}`"
      class="generated-files__panel"
      role="tabpanel"
      tabindex="0"
    >
      <div class="generated-files__meta">
        <div>
          <strong>{{ activeArtifact.filename }}</strong>
          <p>{{ activeArtifact.description }}</p>
        </div>
        <div aria-label="Aktionen für die ausgewählte Datei" class="generated-files__actions" role="group">
          <v-btn
            :aria-label="`${activeArtifact.filename} kopieren`"
            class="studio-touch-target"
            prepend-icon="mdi-content-copy"
            variant="tonal"
            @click="copyArtifact"
          >
            Kopieren
          </v-btn>
          <v-btn
            :aria-label="`${activeArtifact.filename} herunterladen`"
            class="studio-touch-target"
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadArtifact"
          >
            Herunterladen
          </v-btn>
        </div>
      </div>
      <pre class="generated-files__preview"><code>{{ activeArtifact.content }}</code></pre>
    </article>

    <div aria-live="polite" class="generated-files__feedback">
      <p v-if="feedback?.kind === 'success'" role="status">{{ feedback.message }}</p>
      <p v-else-if="feedback?.kind === 'error'" role="alert">{{ feedback.message }}</p>
    </div>
  </section>
</template>
