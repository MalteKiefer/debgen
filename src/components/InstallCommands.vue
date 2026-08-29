<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { copyText, downloadText } from '../features/sources/download'
import type { GeneratedArtifact } from '../features/vendors/model'

const props = defineProps<{
  setupArtifact: GeneratedArtifact
  packageCommand: string
}>()
const { t } = useI18n()

const feedback = ref<{ kind: 'success' | 'error', message: string } | null>(null)
let feedbackVersion = 0

watch(
  () => [
    props.setupArtifact.filename,
    props.setupArtifact.mediaType,
    props.setupArtifact.content,
    props.packageCommand,
  ],
  () => {
    feedbackVersion += 1
    feedback.value = null
  },
  { flush: 'sync' },
)

async function copyCommand(label: string, content: string): Promise<void> {
  const version = ++feedbackVersion
  feedback.value = null
  try {
    await copyText(content)
    if (version !== feedbackVersion) return
    feedback.value = { kind: 'success', message: t('install.copySuccess', { label }) }
  } catch {
    if (version !== feedbackVersion) return
    feedback.value = {
      kind: 'error',
      message: t('install.copyError', { label }),
    }
  }
}

function downloadSetupArtifact(): void {
  feedbackVersion += 1
  feedback.value = null
  try {
    downloadText(
      props.setupArtifact.filename,
      props.setupArtifact.content,
      undefined,
      props.setupArtifact.mediaType,
    )
    feedback.value = {
      kind: 'success',
      message: t('install.downloadSuccess', { filename: props.setupArtifact.filename }),
    }
  } catch {
    feedback.value = {
      kind: 'error',
      message: t('install.downloadError'),
    }
  }
}
</script>

<template>
  <section :aria-label="t('install.ariaLabel')" class="install-commands">
    <header class="install-commands__heading">
      <div>
        <p class="review-step__eyebrow">{{ t('install.eyebrow') }}</p>
        <h3>{{ t('install.title') }}</h3>
      </div>
      <v-icon aria-hidden="true" color="primary" icon="mdi-console-line" size="30" />
    </header>

    <v-alert icon="mdi-shield-alert-outline" type="warning" variant="tonal">
      {{ t('install.warning') }}
    </v-alert>

    <article :aria-label="t('install.setupAria')" class="install-commands__block">
      <div class="install-commands__block-heading">
        <div>
          <h4>{{ t('install.setupTitle') }}</h4>
          <p>{{ t('install.setupDescription') }}</p>
          <p><code>{{ setupArtifact.filename }}</code> · {{ setupArtifact.mediaType }}</p>
        </div>
        <div :aria-label="t('install.setupActions')" class="install-commands__actions" role="group">
          <v-btn
            :aria-label="t('install.setupCopyAria')"
            class="studio-touch-target"
            prepend-icon="mdi-content-copy"
            variant="tonal"
            @click="copyCommand(t('install.setupLabel'), setupArtifact.content)"
          >
            {{ t('actions.copy') }}
          </v-btn>
          <v-btn
            :aria-label="t('files.downloadAria', { filename: setupArtifact.filename })"
            class="studio-touch-target"
            prepend-icon="mdi-download"
            variant="tonal"
            @click="downloadSetupArtifact"
          >
            {{ t('actions.download') }}
          </v-btn>
        </div>
      </div>
      <pre :aria-label="t('files.contentAria', { filename: setupArtifact.filename })" tabindex="0"><code>{{ setupArtifact.content }}</code></pre>
    </article>

    <article :aria-label="t('install.packagesAria')" class="install-commands__block">
      <div class="install-commands__block-heading">
        <div>
          <h4>{{ t('install.packagesTitle') }}</h4>
          <p>{{ t('install.packagesDescription') }}</p>
        </div>
        <v-btn
          :aria-label="t('install.packagesCopyAria')"
          class="studio-touch-target"
          prepend-icon="mdi-content-copy"
          variant="tonal"
          @click="copyCommand(t('install.packageLabel'), packageCommand)"
        >
          {{ t('actions.copy') }}
        </v-btn>
      </div>
      <pre :aria-label="t('install.packageCommandAria')" tabindex="0"><code>{{ packageCommand }}</code></pre>
    </article>

    <div aria-live="polite" class="install-commands__feedback">
      <p v-if="feedback?.kind === 'success'" role="status">{{ feedback.message }}</p>
      <p v-else-if="feedback?.kind === 'error'" role="alert">{{ feedback.message }}</p>
    </div>
  </section>
</template>
