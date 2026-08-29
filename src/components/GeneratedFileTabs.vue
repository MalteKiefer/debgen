<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { copyText, downloadText } from '../features/sources/download'
import type { GeneratedArtifact } from '../features/vendors/model'
import { presentArtifact } from '../features/vendors/presentation'
import { formatPlural } from '../i18n/format'
import type { SupportedLocale } from '../i18n'

const props = defineProps<{
  artifacts: readonly GeneratedArtifact[]
}>()
const { locale, t } = useI18n()

const activeIndex = ref(0)
const feedback = ref<{ kind: 'success' | 'error', message: string } | null>(null)
let feedbackVersion = 0

const activeArtifact = computed(() => props.artifacts[activeIndex.value])
const fileCount = computed(() => formatPlural(locale.value as SupportedLocale, props.artifacts.length, {
  zero: t('counts.files.zero', { count: props.artifacts.length }), one: t('counts.files.one', { count: props.artifacts.length }), two: t('counts.files.two', { count: props.artifacts.length }),
  few: t('counts.files.few', { count: props.artifacts.length }), many: t('counts.files.many', { count: props.artifacts.length }), other: t('counts.files.other', { count: props.artifacts.length }),
}))

function artifactDescription(artifact: GeneratedArtifact): string {
  const descriptor = presentArtifact(artifact)
  const values = { ...descriptor.values }
  if (descriptor.key === 'artifacts.descriptions.categorySources' && artifact.category) {
    values.category = t(`categories.${artifact.category}`)
  }
  return t(descriptor.key, values)
}

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
    feedback.value = { kind: 'success', message: t('files.copySuccess', { filename: artifact.filename }) }
  } catch {
    if (version !== feedbackVersion) return
    feedback.value = {
      kind: 'error',
      message: t('files.copyError'),
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
    feedback.value = { kind: 'success', message: t('files.downloadSuccess', { filename: artifact.filename }) }
  } catch {
    feedback.value = {
      kind: 'error',
      message: t('files.downloadError'),
    }
  }
}
</script>

<template>
  <section aria-labelledby="generated-files-title" class="generated-files">
    <div class="generated-files__heading">
      <div>
        <p class="review-step__eyebrow">{{ t('files.eyebrow') }}</p>
        <h3 id="generated-files-title">{{ t('files.title') }}</h3>
      </div>
      <v-chip prepend-icon="mdi-file-multiple-outline" variant="tonal">
        {{ fileCount }}
      </v-chip>
    </div>

    <div :aria-label="t('files.tabList')" class="generated-files__tabs" role="tablist">
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
      v-for="(artifact, index) in artifacts"
      :id="`file-panel-${index}`"
      :key="`panel-${artifact.filename}`"
      :aria-labelledby="`file-tab-${index}`"
      class="generated-files__panel"
      :hidden="activeIndex !== index"
      role="tabpanel"
      :tabindex="activeIndex === index ? 0 : -1"
    >
      <div class="generated-files__meta">
        <div>
          <strong>{{ artifact.filename }}</strong>
          <p>{{ artifactDescription(artifact) }}</p>
        </div>
        <div :aria-label="t('files.actions')" class="generated-files__actions" role="group">
          <v-btn
            :aria-label="t('files.copyAria', { filename: artifact.filename })"
            class="studio-touch-target"
            prepend-icon="mdi-content-copy"
            variant="tonal"
            @click="copyArtifact"
          >
            {{ t('actions.copy') }}
          </v-btn>
          <v-btn
            :aria-label="t('files.downloadAria', { filename: artifact.filename })"
            class="studio-touch-target"
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadArtifact"
          >
            {{ t('actions.download') }}
          </v-btn>
        </div>
      </div>
      <pre
        :aria-label="t('files.contentAria', { filename: artifact.filename })"
        class="generated-files__preview"
        tabindex="0"
      ><code>{{ artifact.content }}</code></pre>
    </article>

    <div aria-live="polite" class="generated-files__feedback">
      <p v-if="feedback?.kind === 'success'" role="status">{{ feedback.message }}</p>
      <p v-else-if="feedback?.kind === 'error'" role="alert">{{ feedback.message }}</p>
    </div>
  </section>
</template>
