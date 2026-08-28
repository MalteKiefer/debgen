<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { generateSources, getOutputFilename } from '../features/sources/generate'
import type { ReleaseCodename, SourceFormat, SourceOptions } from '../features/sources/model'
import { getRelease } from '../features/sources/releases'
import GeneratorControls from './GeneratorControls.vue'
import SourceOutput from './SourceOutput.vue'

const release = ref<ReleaseCodename>('trixie')
const format = ref<SourceFormat>('deb822')
const includeSource = ref(false)
const includeContrib = ref(false)
const includeNonFree = ref(false)
const includeFirmware = ref(true)
const includeSecurity = ref(true)
const includeUpdates = ref(true)
const includeBackports = ref(false)
const generatedText = ref('')

const filename = computed(() => getOutputFilename(format.value))
const components = computed(() => [
  'main',
  ...(includeContrib.value ? ['contrib'] : []),
  ...(includeNonFree.value ? ['non-free'] : []),
  ...(includeFirmware.value ? ['non-free-firmware'] : []),
])

watch(release, (codename) => {
  const selected = getRelease(codename)

  if (!selected.formats.includes(format.value)) {
    format.value = selected.formats[0]
  }
  if (!selected.components.includes('contrib')) {
    includeContrib.value = false
  }
  if (!selected.components.includes('non-free')) {
    includeNonFree.value = false
  }
  if (!selected.components.includes('non-free-firmware')) {
    includeFirmware.value = false
  }
  if (!selected.capabilities.security) {
    includeSecurity.value = false
  }
  if (!selected.capabilities.updates) {
    includeUpdates.value = false
  }
  if (!selected.capabilities.backports) {
    includeBackports.value = false
  }
}, { flush: 'sync' })

watch([
  release,
  format,
  includeSource,
  includeContrib,
  includeNonFree,
  includeFirmware,
  includeSecurity,
  includeUpdates,
  includeBackports,
], () => {
  generatedText.value = ''
})

function generate(): void {
  const options: SourceOptions = {
    release: release.value,
    format: format.value,
    includeSource: includeSource.value,
    includeSecurity: includeSecurity.value,
    includeUpdates: includeUpdates.value,
    includeBackports: includeBackports.value,
    components: components.value,
  }

  generatedText.value = generateSources(options)
}
</script>

<template>
  <section
    class="source-generator"
    aria-labelledby="source-generator-title"
  >
    <v-card
      class="source-generator__intro"
      color="primary"
      variant="tonal"
    >
      <v-card-text>
        <div class="source-generator__intro-content">
          <v-icon
            aria-hidden="true"
            icon="mdi-debian"
            size="48"
          />
          <div>
            <h1 id="source-generator-title">
              Debian sources generator
            </h1>
            <p>
              Build an official Debian repository configuration from the release catalog bundled with DebGen.
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <GeneratorControls
      v-model:release="release"
      v-model:format="format"
      v-model:include-source="includeSource"
      v-model:include-contrib="includeContrib"
      v-model:include-non-free="includeNonFree"
      v-model:include-firmware="includeFirmware"
      v-model:include-security="includeSecurity"
      v-model:include-updates="includeUpdates"
      v-model:include-backports="includeBackports"
    />

    <div class="source-generator__submit">
      <v-btn
        color="primary"
        prepend-icon="mdi-file-document-plus-outline"
        size="large"
        @click="generate"
      >
        Generate sources
      </v-btn>
    </div>

    <SourceOutput
      v-if="generatedText"
      :content="generatedText"
      :filename="filename"
    >
      <template #actions>
        <slot
          name="actions"
          :content="generatedText"
          :filename="filename"
        />
      </template>
    </SourceOutput>
  </section>
</template>
