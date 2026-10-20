<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { copyText, downloadText } from '../../features/sources/download'
import { generateSources, getOutputFilename } from '../../features/sources/generate'
import { createTar } from '../../features/sources/tar'
import {
  generateInstallScript,
  generatePackageInstallCommand,
  generateRepositoryArtifacts,
} from '../../features/vendors/generate'
import { formatPlural } from '../../i18n/format'
import type { SupportedLocale } from '../../i18n/locales'
import { interfaceEn } from '../../i18n/messages/interface'
import { renderIcon } from '../../site/icons'
import type { SiteCopy } from '../../site/locales'
import type { WorkbenchState } from '../state'

const props = defineProps<{
  copy: SiteCopy
  locale: SupportedLocale
  state: WorkbenchState
}>()

interface PanelFile {
  readonly name: string
  readonly content: string
  readonly mediaType: string
  readonly notes: readonly string[]
}

const ui = computed(() => props.copy.ui)

// Generated risk notes are English catalog texts; map them back to their key to show the localized text.
const warningKeyByEnglishText = new Map<string, string>(Object.entries(interfaceEn.warnings).map(([key, text]) => [text, key]))
const localizeNote = (note: string): string => {
  const key = warningKeyByEnglishText.get(note)
  return key === undefined ? note : (ui.value.warnings as Readonly<Record<string, string>>)[key] ?? note
}

const vendorConfig = computed(() => ({
  release: props.state.release,
  architecture: props.state.architecture,
  productIds: [...props.state.repositories],
}))

const debianFilename = computed(() => getOutputFilename(props.state.format))

const generated = computed<{ files: PanelFile[], packages: string } | { error: string }>(() => {
  try {
    const files: PanelFile[] = [{
      name: debianFilename.value,
      content: generateSources({
        release: props.state.release,
        format: props.state.format,
        includeSource: props.state.includeSource,
        includeSecurity: props.state.includeSecurity,
        includeUpdates: props.state.includeUpdates,
        includeBackports: props.state.includeBackports,
        components: props.state.components,
      }),
      mediaType: 'text/plain',
      notes: [],
    }]
    if (props.state.repositories.length === 0) return { files, packages: '' }
    const artifacts = generateRepositoryArtifacts(vendorConfig.value)
    // Packages are installed by the separate apt-get step after the new sources were reviewed.
    const script = generateInstallScript(vendorConfig.value, artifacts, { includePackageInstallation: false })
    for (const artifact of [...artifacts, script]) {
      files.push({
        name: artifact.filename,
        content: artifact.content,
        mediaType: artifact.mediaType,
        notes: (artifact.riskNotes ?? []).map(localizeNote),
      })
    }
    return { files, packages: generatePackageInstallCommand(vendorConfig.value).trimEnd() }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
})

const files = computed(() => 'files' in generated.value ? generated.value.files : [])
const hasVendorFiles = computed(() => files.value.length > 1)

const chosenName = ref('')
const activeFile = computed(() => files.value.find(file => file.name === chosenName.value) ?? files.value[0])

const highlighted = computed(() => {
  const file = activeFile.value
  if (!file) return []
  const structured = file.name.endsWith('.sources') || file.name.endsWith('.pref')
  return file.content.replace(/\n$/u, '').split('\n').map((line) => {
    const match = structured ? /^([A-Za-z-]+:)(.*)$/u.exec(line) : null
    return match ? { key: match[1]!, rest: match[2]! } : { key: '', rest: line }
  })
})

const installSteps = computed(() => {
  const packages = 'files' in generated.value ? generated.value.packages : ''
  return [
    { title: props.copy.install.debian, description: '', command: `sudo install -m 0644 ${debianFilename.value} /etc/apt/sources.list.d/` },
    ...(hasVendorFiles.value
      ? [{ title: props.copy.install.vendor, description: ui.value.install.setupDescription, command: 'sudo bash install-vendor-repositories.sh' }]
      : []),
    {
      title: props.copy.install.packages,
      description: packages ? ui.value.install.packagesDescription : '',
      command: ['sudo apt-get update', ...(packages ? [`sudo ${packages}`] : [])].join('\n'),
    },
  ]
})

interface Feedback {
  readonly kind: 'success' | 'error'
  readonly message: string
}

const feedback = ref<Feedback | null>(null)

// Feedback describes content that was copied or downloaded; once the files change it is no longer true.
watch(files, () => {
  feedback.value = null
})

const copyActive = async (): Promise<void> => {
  if (!activeFile.value) return
  try {
    await copyText(activeFile.value.content)
    feedback.value = { kind: 'success', message: props.copy.actions.copied }
  } catch {
    feedback.value = { kind: 'error', message: props.copy.errors.copyFailed }
  }
}

const download = (filename: string, content: string | Uint8Array<ArrayBuffer>, mediaType: string): void => {
  try {
    downloadText(filename, content, undefined, mediaType)
    feedback.value = { kind: 'success', message: props.copy.actions.downloaded }
  } catch {
    feedback.value = { kind: 'error', message: props.copy.errors.downloadFailed }
  }
}

const downloadActive = (): void => {
  if (activeFile.value) download(activeFile.value.name, activeFile.value.content, activeFile.value.mediaType)
}

const downloadAll = (): void => download(
  `debgen-${props.state.release}-${props.state.architecture}.tar`,
  createTar(files.value.map(file => ({ name: file.name, content: file.content }))),
  'application/x-tar',
)
</script>

<template>
  <aside class="files-column" :aria-label="copy.sections.files">
    <section class="files" aria-labelledby="files-title">
      <div class="card__head">
        <h2 id="files-title">{{ copy.sections.files }}</h2>
        <span class="files__count">{{ formatPlural(locale, files.length, ui.counts.files) }}</span>
      </div>
      <p v-if="'error' in generated" class="notice" role="alert">{{ generated.error }}</p>
      <template v-else-if="activeFile">
        <fieldset class="files__tabs">
          <legend class="visually-hidden">{{ copy.sections.files }}</legend>
          <label v-for="file in files" :key="file.name" class="file-tab">
            <input
              type="radio"
              name="file"
              :value="file.name"
              :checked="file.name === activeFile.name"
              @change="chosenName = file.name"
            >
            <span>{{ file.name }}</span>
          </label>
        </fieldset>
        <pre class="files__code" tabindex="0" :aria-label="activeFile.name"><code><template v-for="(line, index) in highlighted" :key="index"><span v-if="line.key" class="files__key">{{ line.key }}</span>{{ line.rest }}{{ '\n' }}</template></code></pre>
        <ul v-if="activeFile.notes.length" class="files__notes">
          <li v-for="note in activeFile.notes" :key="note">{{ note }}</li>
        </ul>
        <div class="files__actions">
          <button type="button" class="link-button" @click="copyActive"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
          <button type="button" class="link-button" @click="downloadActive"><span v-html="renderIcon('download')" />{{ copy.actions.download }}</button>
        </div>
        <button type="button" class="primary-button" @click="downloadAll">{{ copy.files.downloadAll }}</button>
        <p v-if="feedback" class="files__feedback" :role="feedback.kind === 'error' ? 'alert' : 'status'">{{ feedback.message }}</p>
      </template>
    </section>

    <section class="card install" aria-labelledby="install-title">
      <h2 id="install-title">{{ copy.sections.install }}</h2>
      <p class="hint">{{ ui.install.warning }}</p>
      <ol class="install__steps">
        <li v-for="step in installSteps" :key="step.title">
          <span class="install__title">{{ step.title }}</span>
          <span v-if="step.description" class="hint">{{ step.description }}</span>
          <pre class="install__command"><code>{{ step.command }}</code></pre>
        </li>
      </ol>
      <p class="install__review">{{ copy.trust.review }}</p>
    </section>
  </aside>
</template>
